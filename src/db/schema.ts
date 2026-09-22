import { relations } from 'drizzle-orm';
import {
  pgTable,
  pgEnum,
  text,
  boolean,
  doublePrecision,
  integer,
  timestamp,
  index,
  uniqueIndex,
  foreignKey,
} from 'drizzle-orm/pg-core';

export const accountType = pgEnum('AccountType', [
  'CHECKING',
  'SAVINGS',
  'CREDIT_CARD',
  'CASH',
  'INVESTMENT',
  'OTHER',
]);
export const transactionType = pgEnum('TransactionType', ['EXPENSE', 'INCOME']);
const id = () =>
  text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());
const createdAt = () => timestamp('createdAt', { precision: 3 }).notNull().defaultNow();
const updatedAt = () =>
  timestamp('updatedAt', { precision: 3 })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date());
const softDelete = () => ({
  isDeleted: boolean('isDeleted').notNull().default(false),
  deletedAt: timestamp('deletedAt', { precision: 3 }),
});

export const accounts = pgTable(
  'Account',
  {
    id: id(),
    userId: text('userId').notNull(),
    name: text('name').notNull(),
    type: accountType('type').notNull(),
    balance: doublePrecision('balance').notNull().default(0),
    institution: text('institution'),
    accountNumber: text('accountNumber'),
    color: text('color'),
    icon: text('icon'),
    notes: text('notes'),
    ...softDelete(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  t => [
    index('Account_userId_idx').on(t.userId),
    index('Account_userId_isDeleted_idx').on(t.userId, t.isDeleted),
  ]
);

export const payees = pgTable(
  'Payee',
  {
    id: id(),
    userId: text('userId').notNull(),
    name: text('name').notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    categoryId: text('categoryId'),
    ...softDelete(),
  },
  t => [
    uniqueIndex('Payee_userId_name_key').on(t.userId, t.name),
    index('Payee_userId_idx').on(t.userId),
  ]
);

export const transactions = pgTable(
  'Transaction',
  {
    id: id(),
    userId: text('userId').notNull(),
    accountId: text('accountId').notNull(),
    categoryId: text('categoryId'),
    categoryGroupId: text('categoryGroupId'),
    payeeId: text('payeeId'),
    amount: doublePrecision('amount').notNull(),
    description: text('description').notNull(),
    date: timestamp('date', { precision: 3 }).notNull(),
    type: transactionType('type').notNull(),
    isTransfer: boolean('isTransfer').notNull().default(false),
    transferId: text('transferId'),
    linkedAccountId: text('linkedAccountId'),
    ...softDelete(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  t => [
    foreignKey({
      name: 'Transaction_accountId_fkey',
      columns: [t.accountId],
      foreignColumns: [accounts.id],
    })
      .onDelete('restrict')
      .onUpdate('cascade'),
    foreignKey({
      name: 'Transaction_payeeId_fkey',
      columns: [t.payeeId],
      foreignColumns: [payees.id],
    })
      .onDelete('restrict')
      .onUpdate('cascade'),
    foreignKey({
      name: 'Transaction_transferId_fkey',
      columns: [t.transferId],
      foreignColumns: [t.id],
    })
      .onDelete('set null')
      .onUpdate('cascade'),
    foreignKey({
      name: 'Transaction_linkedAccountId_fkey',
      columns: [t.linkedAccountId],
      foreignColumns: [accounts.id],
    })
      .onDelete('set null')
      .onUpdate('cascade'),
    uniqueIndex('Transaction_transferId_key').on(t.transferId),
    index('Transaction_userId_idx').on(t.userId),
    index('Transaction_accountId_idx').on(t.accountId),
    index('Transaction_categoryId_idx').on(t.categoryId),
    index('Transaction_userId_date_idx').on(t.userId, t.date),
    index('Transaction_date_idx').on(t.date),
    index('Transaction_userId_isDeleted_idx').on(t.userId, t.isDeleted),
    index('Transaction_transferId_idx').on(t.transferId),
  ]
);

export const monthlyHistory = pgTable(
  'MonthlyHistory',
  {
    id: id(),
    userId: text('userId').notNull(),
    month: integer('month').notNull(),
    year: integer('year').notNull(),
    income: doublePrecision('income').notNull().default(0),
    expense: doublePrecision('expense').notNull().default(0),
  },
  t => [
    uniqueIndex('MonthlyHistory_userId_month_year_key').on(t.userId, t.month, t.year),
    index('MonthlyHistory_userId_year_month_idx').on(t.userId, t.year, t.month),
  ]
);

export const monthlyCategoryGroupHistory = pgTable(
  'MonthlyCategoryGroupHistory',
  {
    id: id(),
    userId: text('userId').notNull(),
    categoryGroupId: text('categoryGroupId').notNull(),
    month: integer('month').notNull(),
    year: integer('year').notNull(),
    income: doublePrecision('income').notNull().default(0),
    expense: doublePrecision('expense').notNull().default(0),
  },
  t => [
    uniqueIndex('MonthlyCategoryGroupHistory_userId_categoryGroupId_month_year_key').on(
      t.userId,
      t.categoryGroupId,
      t.month,
      t.year
    ),
    index('MonthlyCategoryGroupHistory_userId_year_month_idx').on(t.userId, t.year, t.month),
    index('MonthlyCategoryGroupHistory_categoryGroupId_idx').on(t.categoryGroupId),
  ]
);

export const accountRelations = relations(accounts, ({ many }) => ({
  transactions: many(transactions, { relationName: 'account' }),
  linkedTransactions: many(transactions, { relationName: 'linkedAccount' }),
}));
export const payeeRelations = relations(payees, ({ many }) => ({
  transactions: many(transactions),
}));
export const transactionRelations = relations(transactions, ({ one }) => ({
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id],
    relationName: 'account',
  }),
  payee: one(payees, { fields: [transactions.payeeId], references: [payees.id] }),
  linkedAccount: one(accounts, {
    fields: [transactions.linkedAccountId],
    references: [accounts.id],
    relationName: 'linkedAccount',
  }),
  transferPair: one(transactions, {
    fields: [transactions.transferId],
    references: [transactions.id],
    relationName: 'transferPair',
  }),
  transferLinked: one(transactions, {
    fields: [transactions.id],
    references: [transactions.transferId],
    relationName: 'transferPair',
  }),
}));

export type Account = typeof accounts.$inferSelect;
export type Payee = typeof payees.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
