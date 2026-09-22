import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { PgDatabase } from 'drizzle-orm/pg-core';
import * as schema from './schema';
import {
  accounts,
  payees,
  transactions,
  monthlyHistory,
  monthlyCategoryGroupHistory,
} from './schema';
import { CreateAccountWithUserSchemaType } from '@/schema/accounts';
import { CreatePayeeWithUserSchemaType } from '@/schema/payees';
import { createTransactionWithUserSchemaType } from '@/schema/transaction';

// The shared PostgreSQL query API lets integration tests use an isolated PGlite database.
export function createRepository(db: PgDatabase<any, typeof schema>) {
  return {
    listAccounts(userId: string) {
      return db
        .select({
          id: accounts.id,
          type: accounts.type,
          name: accounts.name,
          icon: accounts.icon,
          color: accounts.color,
          balance: accounts.balance,
          institution: accounts.institution,
          accountNumber: accounts.accountNumber,
        })
        .from(accounts)
        .where(and(eq(accounts.userId, userId), eq(accounts.isDeleted, false)))
        .orderBy(asc(accounts.createdAt));
    },
    async findAccount(userId: string, id: string) {
      const [account] = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.id, id), eq(accounts.userId, userId), eq(accounts.isDeleted, false)))
        .limit(1);
      return account;
    },
    listPayees(userId: string) {
      return db
        .select({ id: payees.id, name: payees.name, categoryId: payees.categoryId })
        .from(payees)
        .where(and(eq(payees.userId, userId), eq(payees.isDeleted, false)))
        .orderBy(asc(payees.createdAt));
    },
    listTransactions(userId: string) {
      return db
        .select({
          id: transactions.id,
          amount: transactions.amount,
          date: transactions.date,
          type: transactions.type,
          description: transactions.description,
          payeeId: transactions.payeeId,
          accountId: transactions.accountId,
          categoryId: transactions.categoryId,
          categoryGroupId: transactions.categoryGroupId,
        })
        .from(transactions)
        .where(and(eq(transactions.userId, userId), eq(transactions.isDeleted, false)))
        .orderBy(desc(transactions.date));
    },
    async createAccount(data: CreateAccountWithUserSchemaType) {
      const { name, type, userId, institution, accountNumber, color, icon, notes } = data;
      const [account] = await db
        .insert(accounts)
        .values({ name, type, userId, institution, accountNumber, color, icon, notes })
        .returning();
      return account;
    },
    async createPayee(data: CreatePayeeWithUserSchemaType) {
      const [payee] = await db
        .insert(payees)
        .values({ name: data.name, userId: data.userId, categoryId: data.categoryId || null })
        .returning();
      return payee;
    },
    async createTransaction(data: createTransactionWithUserSchemaType) {
      const { userId, accountId, amount, date, type, categoryId, categoryGroupId } = data;
      return db.transaction(async tx => {
        const [account] = await tx
          .select({ id: accounts.id })
          .from(accounts)
          .where(
            and(
              eq(accounts.id, accountId),
              eq(accounts.userId, userId),
              eq(accounts.isDeleted, false)
            )
          )
          .for('update');
        if (!account) throw new Error('Account not found');
        const payeeId = data.payeeId || null;
        if (payeeId) {
          const [payee] = await tx
            .select({ id: payees.id })
            .from(payees)
            .where(
              and(eq(payees.id, payeeId), eq(payees.userId, userId), eq(payees.isDeleted, false))
            )
            .for('share');
          if (!payee) throw new Error('Payee not found');
        }
        const [transaction] = await tx
          .insert(transactions)
          .values({
            userId,
            accountId,
            amount,
            date,
            type,
            categoryId,
            categoryGroupId,
            payeeId,
            description: data.description || '',
          })
          .returning();
        const income = type === 'INCOME' ? amount : 0;
        const expense = type === 'EXPENSE' ? amount : 0;
        const month = date.getUTCMonth() + 1;
        const year = date.getUTCFullYear();
        await tx
          .update(accounts)
          .set({ balance: sql`${accounts.balance} + ${income - expense}` })
          .where(eq(accounts.id, accountId));
        await tx
          .insert(monthlyHistory)
          .values({ userId, month, year, income, expense })
          .onConflictDoUpdate({
            target: [monthlyHistory.userId, monthlyHistory.month, monthlyHistory.year],
            set: {
              income: sql`${monthlyHistory.income} + ${income}`,
              expense: sql`${monthlyHistory.expense} + ${expense}`,
            },
          });
        await tx
          .insert(monthlyCategoryGroupHistory)
          .values({ userId, categoryGroupId, month, year, income, expense })
          .onConflictDoUpdate({
            target: [
              monthlyCategoryGroupHistory.userId,
              monthlyCategoryGroupHistory.categoryGroupId,
              monthlyCategoryGroupHistory.month,
              monthlyCategoryGroupHistory.year,
            ],
            set: {
              income: sql`${monthlyCategoryGroupHistory.income} + ${income}`,
              expense: sql`${monthlyCategoryGroupHistory.expense} + ${expense}`,
            },
          });
        return transaction;
      });
    },
    async deleteTransaction(userId: string, id: string) {
      return db.transaction(async tx => {
        const [transaction] = await tx
          .select()
          .from(transactions)
          .where(
            and(
              eq(transactions.id, id),
              eq(transactions.userId, userId),
              eq(transactions.isDeleted, false)
            )
          )
          .for('update');
        if (!transaction) throw new Error('Transaction not found');
        // Paired transfers require a paired operation; never reverse only one side.
        if (transaction.isTransfer || transaction.transferId || transaction.linkedAccountId)
          throw new Error('Paired transfers must be deleted together');
        const income = transaction.type === 'INCOME' ? transaction.amount : 0;
        const expense = transaction.type === 'EXPENSE' ? transaction.amount : 0;
        const month = transaction.date.getUTCMonth() + 1;
        const year = transaction.date.getUTCFullYear();
        await tx
          .update(transactions)
          .set({ isDeleted: true, deletedAt: new Date() })
          .where(eq(transactions.id, id));
        const account = await tx
          .update(accounts)
          .set({ balance: sql`${accounts.balance} - ${income - expense}` })
          .where(and(eq(accounts.id, transaction.accountId), eq(accounts.userId, userId)))
          .returning({ id: accounts.id });
        if (!account.length) throw new Error('Account not found');
        const history = await tx
          .update(monthlyHistory)
          .set({
            income: sql`${monthlyHistory.income} - ${income}`,
            expense: sql`${monthlyHistory.expense} - ${expense}`,
          })
          .where(
            and(
              eq(monthlyHistory.userId, userId),
              eq(monthlyHistory.month, month),
              eq(monthlyHistory.year, year)
            )
          )
          .returning({ id: monthlyHistory.id });
        if (!history.length)
          throw new Error('Monthly history is missing; transaction was not deleted');
        if (transaction.categoryGroupId) {
          const category = await tx
            .update(monthlyCategoryGroupHistory)
            .set({
              income: sql`${monthlyCategoryGroupHistory.income} - ${income}`,
              expense: sql`${monthlyCategoryGroupHistory.expense} - ${expense}`,
            })
            .where(
              and(
                eq(monthlyCategoryGroupHistory.userId, userId),
                eq(monthlyCategoryGroupHistory.categoryGroupId, transaction.categoryGroupId),
                eq(monthlyCategoryGroupHistory.month, month),
                eq(monthlyCategoryGroupHistory.year, year)
              )
            )
            .returning({ id: monthlyCategoryGroupHistory.id });
          if (!category.length)
            throw new Error('Category history is missing; transaction was not deleted');
        }
      });
    },
  };
}
