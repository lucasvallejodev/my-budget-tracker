import { relations, sql } from 'drizzle-orm';
import {
  pgTable,
  pgEnum,
  text,
  char,
  boolean,
  bigint,
  integer,
  numeric,
  date,
  timestamp,
  index,
  uniqueIndex,
  primaryKey,
  check,
} from 'drizzle-orm/pg-core';

export const accountType = pgEnum('account_type', [
  'checking',
  'savings',
  'cash',
  'credit_card',
  'loan',
  'investment',
  'other',
]);
export const accountClassification = pgEnum('account_classification', ['asset', 'liability']);
export const categoryKind = pgEnum('category_kind', ['income', 'expense']);
export const transactionKind = pgEnum('transaction_kind', ['standard', 'transfer', 'opening']);
export const transactionStatus = pgEnum('transaction_status', ['pending', 'cleared', 'reconciled']);

const id = () =>
  text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();

const updatedAt = () =>
  timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

/** Global ISO-4217 reference data, seeded by migration. */
export const currencies = pgTable('currencies', {
  code: char('code', { length: 3 }).primaryKey(),
  name: text('name').notNull(),
  symbol: text('symbol').notNull(),
  minorUnits: integer('minor_units').notNull().default(2),
  isActive: boolean('is_active').notNull().default(true),
});

export const userSettings = pgTable('user_settings', {
  userId: text('user_id').primaryKey(),
  primaryCurrency: char('primary_currency', { length: 3 })
    .notNull()
    .references(() => currencies.code),
  locale: text('locale').notNull().default('en-US'),
  seededVersion: integer('seeded_version'),
  showConvertedTotals: boolean('show_converted_totals').notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const accounts = pgTable(
  'accounts',
  {
    id: id(),
    userId: text('user_id').notNull(),
    name: text('name').notNull(),
    type: accountType('type').notNull(),
    classification: accountClassification('classification').notNull(),
    currency: char('currency', { length: 3 })
      .notNull()
      .references(() => currencies.code),
    institution: text('institution'),
    accountNumber: text('account_number'),
    color: text('color'),
    icon: text('icon'),
    notes: text('notes'),
    countsInSpending: boolean('counts_in_spending').notNull().default(true),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  t => [index('accounts_user_idx').on(t.userId)]
);

export const categoryGroups = pgTable(
  'category_groups',
  {
    id: id(),
    userId: text('user_id').notNull(),
    name: text('name').notNull(),
    kind: categoryKind('kind').notNull(),
    color: text('color').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    isSystem: boolean('is_system').notNull().default(false),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  t => [index('category_groups_user_idx').on(t.userId)]
);

export const categories = pgTable(
  'categories',
  {
    id: id(),
    userId: text('user_id').notNull(),
    groupId: text('group_id')
      .notNull()
      .references(() => categoryGroups.id),
    name: text('name').notNull(),
    icon: text('icon').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  t => [index('categories_user_idx').on(t.userId), index('categories_group_idx').on(t.groupId)]
);

export const payees = pgTable(
  'payees',
  {
    id: id(),
    userId: text('user_id').notNull(),
    name: text('name').notNull(),
    defaultCategoryId: text('default_category_id').references(() => categories.id),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  t => [uniqueIndex('payees_user_name_key').on(t.userId, t.name)]
);

export const transactions = pgTable(
  'transactions',
  {
    id: id(),
    userId: text('user_id').notNull(),
    accountId: text('account_id')
      .notNull()
      .references(() => accounts.id),
    categoryId: text('category_id').references(() => categories.id),
    payeeId: text('payee_id').references(() => payees.id),
    /** Signed minor units (cents): negative = money out, positive = money in. */
    amountMinor: bigint('amount_minor', { mode: 'number' }).notNull(),
    currency: char('currency', { length: 3 })
      .notNull()
      .references(() => currencies.code),
    date: date('date', { mode: 'string' }).notNull(),
    kind: transactionKind('kind').notNull().default('standard'),
    transferId: text('transfer_id'),
    status: transactionStatus('status').notNull().default('cleared'),
    needsReview: boolean('needs_review').notNull().default(false),
    excluded: boolean('excluded').notNull().default(false),
    memo: text('memo').notNull().default(''),
    importId: text('import_id'),
    originalPayee: text('original_payee'),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  t => [
    index('transactions_user_date_idx').on(t.userId, t.date),
    index('transactions_account_date_idx').on(t.accountId, t.date),
    index('transactions_user_category_idx').on(t.userId, t.categoryId),
    index('transactions_transfer_idx').on(t.transferId),
    uniqueIndex('transactions_account_import_key')
      .on(t.accountId, t.importId)
      .where(sql`${t.importId} IS NOT NULL`),
    check(
      'transactions_category_kind_check',
      sql`${t.kind} = 'standard' OR ${t.categoryId} IS NULL`
    ),
    check(
      'transactions_transfer_kind_check',
      sql`(${t.kind} = 'transfer') = (${t.transferId} IS NOT NULL)`
    ),
  ]
);

export const exchangeRates = pgTable(
  'exchange_rates',
  {
    userId: text('user_id').notNull(),
    base: char('base', { length: 3 })
      .notNull()
      .references(() => currencies.code),
    quote: char('quote', { length: 3 })
      .notNull()
      .references(() => currencies.code),
    date: date('date', { mode: 'string' }).notNull(),
    rate: numeric('rate', { precision: 18, scale: 8 }).notNull(),
    source: text('source').notNull().default('manual'),
    createdAt: createdAt(),
  },
  t => [primaryKey({ columns: [t.userId, t.base, t.quote, t.date] })]
);

export const budgets = pgTable(
  'budgets',
  {
    id: id(),
    userId: text('user_id').notNull(),
    categoryId: text('category_id')
      .notNull()
      .references(() => categories.id),
    month: date('month', { mode: 'string' }).notNull(),
    currency: char('currency', { length: 3 })
      .notNull()
      .references(() => currencies.code),
    amountMinor: bigint('amount_minor', { mode: 'number' }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  t => [
    uniqueIndex('budgets_category_month_currency_key').on(t.categoryId, t.month, t.currency),
    index('budgets_user_month_idx').on(t.userId, t.month),
  ]
);

export const rules = pgTable(
  'rules',
  {
    id: id(),
    userId: text('user_id').notNull(),
    name: text('name').notNull(),
    /** Case-insensitive substring matched against payee name / original payee / memo. */
    pattern: text('pattern').notNull(),
    categoryId: text('category_id')
      .notNull()
      .references(() => categories.id),
    priority: integer('priority').notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  t => [index('rules_user_idx').on(t.userId)]
);

export const categoryGroupRelations = relations(categoryGroups, ({ many }) => ({
  categories: many(categories),
}));
export const categoryRelations = relations(categories, ({ one }) => ({
  group: one(categoryGroups, { fields: [categories.groupId], references: [categoryGroups.id] }),
}));
export const transactionRelations = relations(transactions, ({ one }) => ({
  account: one(accounts, { fields: [transactions.accountId], references: [accounts.id] }),
  category: one(categories, { fields: [transactions.categoryId], references: [categories.id] }),
  payee: one(payees, { fields: [transactions.payeeId], references: [payees.id] }),
}));

export type Currency = typeof currencies.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type CategoryGroup = typeof categoryGroups.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Payee = typeof payees.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type Budget = typeof budgets.$inferSelect;
export type Rule = typeof rules.$inferSelect;
