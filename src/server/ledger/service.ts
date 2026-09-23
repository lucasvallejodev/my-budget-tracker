import { and, desc, eq, gte, ilike, inArray, isNull, lt, or, sql, SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { accounts, categories, categoryGroups, payees, transactions } from '@/db/schema';
import { Db, DbOrTx, ServiceError, notFound } from '../db';
import { createPayeeService } from '../payees/service';

export type TransactionRow = {
  id: string;
  accountId: string;
  accountName: string;
  accountCurrency: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryIcon: string | null;
  groupId: string | null;
  groupName: string | null;
  groupColor: string | null;
  groupKind: 'income' | 'expense' | null;
  payeeId: string | null;
  payeeName: string | null;
  amountMinor: number;
  currency: string;
  date: string;
  kind: 'standard' | 'transfer' | 'opening';
  transferId: string | null;
  counterpartAccountId: string | null;
  counterpartAccountName: string | null;
  status: 'pending' | 'cleared' | 'reconciled';
  needsReview: boolean;
  excluded: boolean;
  memo: string;
  importId: string | null;
  originalPayee: string | null;
};

export type ListFilters = {
  month?: string; // YYYY-MM
  from?: string;
  to?: string;
  accountId?: string;
  categoryId?: string;
  needsReview?: boolean;
  kind?: TransactionRow['kind'];
  search?: string;
  ids?: string[];
  limit?: number;
  offset?: number;
};

export type StandardInput = {
  accountId: string;
  amountMinor: number;
  date: string;
  categoryId?: string | null;
  payeeId?: string | null;
  memo?: string;
  status?: TransactionRow['status'];
  excluded?: boolean;
  needsReview?: boolean;
  importId?: string | null;
  originalPayee?: string | null;
};

export type TransferInput = {
  fromAccountId: string;
  toAccountId: string;
  amountFromMinor: number; // positive
  amountToMinor?: number; // positive; required when currencies differ
  date: string;
  memo?: string;
  status?: TransactionRow['status'];
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const monthRange = (month: string) => {
  if (!/^\d{4}-\d{2}$/.test(month)) throw new ServiceError('Month must be YYYY-MM');
  const [year, monthIndex] = month.split('-').map(Number);
  const start = `${month}-01`;
  const next = new Date(Date.UTC(year, monthIndex, 1)).toISOString().slice(0, 10);

  return { start, end: next };
};

export const createLedgerService = (db: Db) => {
  const payeeService = createPayeeService(db);

  const ownedAccount = async (tx: DbOrTx, userId: string, id: string) => {
    const [account] = await tx
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId), isNull(accounts.deletedAt)))
      .for('update');

    if (!account) notFound('Account');
    if (account.archivedAt) throw new ServiceError('This account is archived');

    return account;
  };

  const assertCategory = async (tx: DbOrTx, userId: string, id: string) => {
    const [category] = await tx
      .select({ id: categories.id })
      .from(categories)
      .where(
        and(eq(categories.id, id), eq(categories.userId, userId), isNull(categories.archivedAt))
      );

    if (!category) notFound('Category');
  };

  const assertPayee = async (tx: DbOrTx, userId: string, id: string) => {
    const [payee] = await tx
      .select({ id: payees.id })
      .from(payees)
      .where(and(eq(payees.id, id), eq(payees.userId, userId)));

    if (!payee) notFound('Payee');
  };

  const assertDate = (date: string) => {
    if (!DATE_RE.test(date)) throw new ServiceError('Date must be YYYY-MM-DD');
  };

  const ownedTransaction = async (tx: DbOrTx, userId: string, id: string) => {
    const [row] = await tx
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.id, id),
          eq(transactions.userId, userId),
          isNull(transactions.deletedAt)
        )
      )
      .for('update');

    return row ?? notFound('Transaction');
  };

  return {
    async list(userId: string, filters: ListFilters = {}): Promise<TransactionRow[]> {
      const peer = alias(transactions, 'peer');
      const peerAccount = alias(accounts, 'peer_account');

      const conditions: (SQL | undefined)[] = [
        eq(transactions.userId, userId),
        isNull(transactions.deletedAt),
      ];

      if (filters.month) {
        const { start, end } = monthRange(filters.month);

        conditions.push(gte(transactions.date, start), lt(transactions.date, end));
      }

      if (filters.from) conditions.push(gte(transactions.date, filters.from));
      if (filters.to) conditions.push(sql`${transactions.date} <= ${filters.to}`);
      if (filters.accountId) conditions.push(eq(transactions.accountId, filters.accountId));
      if (filters.categoryId) conditions.push(eq(transactions.categoryId, filters.categoryId));
      if (filters.needsReview) conditions.push(eq(transactions.needsReview, true));
      if (filters.kind) conditions.push(eq(transactions.kind, filters.kind));
      if (filters.ids) conditions.push(inArray(transactions.id, filters.ids));

      if (filters.search) {
        const term = `%${filters.search}%`;

        conditions.push(
          or(
            ilike(transactions.memo, term),
            ilike(payees.name, term),
            ilike(transactions.originalPayee, term),
            ilike(categories.name, term)
          )
        );
      }

      const rows = await db
        .select({
          id: transactions.id,
          accountId: transactions.accountId,
          accountName: accounts.name,
          accountCurrency: accounts.currency,
          categoryId: transactions.categoryId,
          categoryName: categories.name,
          categoryIcon: categories.icon,
          groupId: categoryGroups.id,
          groupName: categoryGroups.name,
          groupColor: categoryGroups.color,
          groupKind: categoryGroups.kind,
          payeeId: transactions.payeeId,
          payeeName: payees.name,
          amountMinor: transactions.amountMinor,
          currency: transactions.currency,
          date: transactions.date,
          kind: transactions.kind,
          transferId: transactions.transferId,
          counterpartAccountId: peerAccount.id,
          counterpartAccountName: peerAccount.name,
          status: transactions.status,
          needsReview: transactions.needsReview,
          excluded: transactions.excluded,
          memo: transactions.memo,
          importId: transactions.importId,
          originalPayee: transactions.originalPayee,
        })
        .from(transactions)
        .innerJoin(accounts, eq(accounts.id, transactions.accountId))
        .leftJoin(categories, eq(categories.id, transactions.categoryId))
        .leftJoin(categoryGroups, eq(categoryGroups.id, categories.groupId))
        .leftJoin(payees, eq(payees.id, transactions.payeeId))
        .leftJoin(
          peer,
          and(
            eq(peer.transferId, transactions.transferId),
            sql`${peer.id} <> ${transactions.id}`,
            isNull(peer.deletedAt)
          )
        )
        .leftJoin(peerAccount, eq(peerAccount.id, peer.accountId))
        .where(and(...conditions))
        .orderBy(desc(transactions.date), desc(transactions.createdAt))
        .limit(Math.min(filters.limit ?? 500, 2000))
        .offset(filters.offset ?? 0);

      return rows.map(row => ({ ...row, amountMinor: Number(row.amountMinor) }));
    },

    async get(userId: string, id: string) {
      const [row] = await this.list(userId, { ids: [id], limit: 1 });

      return row ?? notFound('Transaction');
    },

    async createStandard(userId: string, input: StandardInput) {
      assertDate(input.date);

      if (!Number.isInteger(input.amountMinor) || input.amountMinor === 0) {
        throw new ServiceError('Amount must be a non-zero whole number of minor units');
      }

      const row = await db.transaction(async tx => {
        const account = await ownedAccount(tx, userId, input.accountId);

        if (input.categoryId) await assertCategory(tx, userId, input.categoryId);
        if (input.payeeId) await assertPayee(tx, userId, input.payeeId);

        const [created] = await tx
          .insert(transactions)
          .values({
            userId,
            accountId: account.id,
            currency: account.currency,
            amountMinor: input.amountMinor,
            date: input.date,
            kind: 'standard',
            categoryId: input.categoryId || null,
            payeeId: input.payeeId || null,
            memo: input.memo?.trim() ?? '',
            status: input.status ?? 'cleared',
            excluded: input.excluded ?? false,
            needsReview: input.needsReview ?? !input.categoryId,
            importId: input.importId || null,
            originalPayee: input.originalPayee || null,
          })
          .returning();

        return created;
      });

      if (row.payeeId && row.categoryId) {
        await payeeService.learnDefaultCategory(userId, row.payeeId);
      }

      return row;
    },

    async updateStandard(userId: string, id: string, input: Partial<StandardInput>) {
      if (input.date) assertDate(input.date);

      if (
        input.amountMinor !== undefined &&
        (!Number.isInteger(input.amountMinor) || input.amountMinor === 0)
      ) {
        throw new ServiceError('Amount must be a non-zero whole number of minor units');
      }

      const row = await db.transaction(async tx => {
        const existing = await ownedTransaction(tx, userId, id);

        if (existing.kind === 'transfer') {
          throw new ServiceError('Use the transfer editor for transfer legs');
        }

        if (
          existing.status === 'reconciled' &&
          (input.amountMinor !== undefined || input.date || input.accountId)
        ) {
          throw new ServiceError('Reconciled transactions are locked; unlock them first');
        }

        const patch: Partial<typeof transactions.$inferInsert> = {};

        if (input.accountId && input.accountId !== existing.accountId) {
          const account = await ownedAccount(tx, userId, input.accountId);

          patch.accountId = account.id;
          patch.currency = account.currency;
        }

        if (input.categoryId !== undefined) {
          if (input.categoryId) await assertCategory(tx, userId, input.categoryId);

          if (existing.kind !== 'standard' && input.categoryId) {
            throw new ServiceError('Only standard transactions can have a category');
          }

          patch.categoryId = input.categoryId || null;
          patch.needsReview = input.needsReview ?? !input.categoryId;
        }

        if (input.payeeId !== undefined) {
          if (input.payeeId) await assertPayee(tx, userId, input.payeeId);
          patch.payeeId = input.payeeId || null;
        }

        if (input.amountMinor !== undefined) patch.amountMinor = input.amountMinor;
        if (input.date) patch.date = input.date;
        if (input.memo !== undefined) patch.memo = input.memo.trim();
        if (input.status) patch.status = input.status;
        if (input.excluded !== undefined) patch.excluded = input.excluded;
        if (input.needsReview !== undefined) patch.needsReview = input.needsReview;

        const [updated] = await tx
          .update(transactions)
          .set(patch)
          .where(eq(transactions.id, id))
          .returning();

        return updated;
      });

      if (row.payeeId && row.categoryId) {
        await payeeService.learnDefaultCategory(userId, row.payeeId);
      }

      return row;
    },

    async remove(userId: string, id: string) {
      await db.transaction(async tx => {
        const existing = await ownedTransaction(tx, userId, id);
        const now = new Date();

        if (existing.transferId) {
          await tx
            .update(transactions)
            .set({ deletedAt: now })
            .where(
              and(eq(transactions.transferId, existing.transferId), eq(transactions.userId, userId))
            );
        } else {
          await tx.update(transactions).set({ deletedAt: now }).where(eq(transactions.id, id));
        }
      });
    },

    async setStatus(userId: string, id: string, status: TransactionRow['status']) {
      await db.transaction(async tx => {
        const existing = await ownedTransaction(tx, userId, id);
        const ids = existing.transferId ? undefined : [id];

        await tx
          .update(transactions)
          .set({ status })
          .where(
            ids
              ? eq(transactions.id, id)
              : and(
                  eq(transactions.transferId, existing.transferId!),
                  eq(transactions.userId, userId)
                )
          );
      });
    },

    /** Writes both legs of a transfer in one transaction and returns them. */
    async createTransfer(userId: string, input: TransferInput) {
      assertDate(input.date);

      if (input.fromAccountId === input.toAccountId) {
        throw new ServiceError('Choose two different accounts');
      }

      if (!Number.isInteger(input.amountFromMinor) || input.amountFromMinor <= 0) {
        throw new ServiceError('Amount must be a positive whole number of minor units');
      }

      return db.transaction(async tx => {
        const from = await ownedAccount(tx, userId, input.fromAccountId);
        const to = await ownedAccount(tx, userId, input.toAccountId);
        let amountTo = input.amountToMinor;

        if (from.currency === to.currency) amountTo = amountTo ?? input.amountFromMinor;
        else if (!amountTo || !Number.isInteger(amountTo) || amountTo <= 0) {
          throw new ServiceError(
            `Enter the amount received in ${to.currency} for this cross-currency transfer`
          );
        }

        const transferId = crypto.randomUUID();
        const memo = input.memo?.trim() ?? '';
        const status = input.status ?? 'cleared';

        const legs = await tx
          .insert(transactions)
          .values([
            {
              userId,
              accountId: from.id,
              currency: from.currency,
              amountMinor: -input.amountFromMinor,
              date: input.date,
              kind: 'transfer',
              transferId,
              memo,
              status,
            },
            {
              userId,
              accountId: to.id,
              currency: to.currency,
              amountMinor: amountTo,
              date: input.date,
              kind: 'transfer',
              transferId,
              memo,
              status,
            },
          ])
          .returning();

        return { transferId, legs };
      });
    },

    async updateTransfer(userId: string, transferId: string, input: Partial<TransferInput>) {
      if (input.date) assertDate(input.date);

      return db.transaction(async tx => {
        const legs = await tx
          .select()
          .from(transactions)
          .where(
            and(
              eq(transactions.transferId, transferId),
              eq(transactions.userId, userId),
              isNull(transactions.deletedAt)
            )
          )
          .for('update');

        if (legs.length !== 2) notFound('Transfer');
        const outLeg = legs.find(leg => leg.amountMinor < 0)!;
        const inLeg = legs.find(leg => leg.amountMinor > 0)!;
        const from = await ownedAccount(tx, userId, input.fromAccountId ?? outLeg.accountId);
        const to = await ownedAccount(tx, userId, input.toAccountId ?? inLeg.accountId);

        if (from.id === to.id) throw new ServiceError('Choose two different accounts');
        const amountFrom = input.amountFromMinor ?? -Number(outLeg.amountMinor);
        let amountTo = input.amountToMinor;

        if (from.currency === to.currency) amountTo = amountFrom;
        else {
          amountTo =
            amountTo ?? (to.id === inLeg.accountId ? Number(inLeg.amountMinor) : undefined);
        }

        if (!amountTo || amountTo <= 0 || amountFrom <= 0) {
          throw new ServiceError('Transfer amounts must be positive');
        }

        const shared = {
          date: input.date ?? outLeg.date,
          memo: input.memo?.trim() ?? outLeg.memo,
          status: input.status ?? outLeg.status,
        };

        await tx
          .update(transactions)
          .set({
            ...shared,
            accountId: from.id,
            currency: from.currency,
            amountMinor: -amountFrom,
          })
          .where(eq(transactions.id, outLeg.id));
        await tx
          .update(transactions)
          .set({
            ...shared,
            accountId: to.id,
            currency: to.currency,
            amountMinor: amountTo,
          })
          .where(eq(transactions.id, inLeg.id));

        return { transferId };
      });
    },

    /** Marks two existing standard rows as the two legs of one transfer (used by import matching). */
    async linkAsTransfer(userId: string, outId: string, inId: string) {
      return db.transaction(async tx => {
        const outRow = await ownedTransaction(tx, userId, outId);
        const inRow = await ownedTransaction(tx, userId, inId);

        if (outRow.kind !== 'standard' || inRow.kind !== 'standard') {
          throw new ServiceError('Only standard transactions can be linked');
        }

        if (outRow.accountId === inRow.accountId) {
          throw new ServiceError('Transfer legs must be in different accounts');
        }

        if (Number(outRow.amountMinor) >= 0 || Number(inRow.amountMinor) <= 0) {
          throw new ServiceError('One leg must be money out and the other money in');
        }

        const transferId = crypto.randomUUID();

        for (const legId of [outId, inId]) {
          await tx
            .update(transactions)
            .set({
              kind: 'transfer',
              transferId,
              categoryId: null,
              payeeId: null,
              needsReview: false,
            })
            .where(eq(transactions.id, legId));
        }

        return { transferId };
      });
    },

    async needsReviewCount(userId: string) {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, userId),
            eq(transactions.needsReview, true),
            isNull(transactions.deletedAt)
          )
        );

      return Number(count);
    },
  };
};
