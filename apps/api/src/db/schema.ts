import { relations, sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  char,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

import { DefaultWeekendDays, type PeriodRuleValues } from '@coinkeeper/shared/schema/settings';

import {
  accountClassification,
  accountType,
  categoryKind,
  createdAt,
  deletedAt,
  id,
  transactionKind,
  transactionStatus,
  updatedAt,
  userId,
} from './columns';
import { recurringSeries } from './planning';

export * from './columns';
export * from './planning';
export type * from './types';

const DEFAULT_MINOR_UNITS = 2;

export const users = pgTable(
  'users',
  {
    id: id(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    name: text('name'),
    lastSignInAt: timestamp('last_sign_in_at', { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  columns => [uniqueIndex('users_email_key').on(columns.email)]
);

export const sessions = pgTable(
  'sessions',
  {
    id: id(),
    userId: userId(),
    tokenHash: text('token_hash').notNull(),
    userAgent: text('user_agent'),
    ipAddress: text('ip_address'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: createdAt(),
  },
  columns => [
    uniqueIndex('sessions_token_hash_key').on(columns.tokenHash),
    index('sessions_user_idx').on(columns.userId),
    index('sessions_expires_idx').on(columns.expiresAt),
  ]
);

export const currencies = pgTable('currencies', {
  code: char('code', { length: 3 }).primaryKey(),
  name: text('name').notNull(),
  symbol: text('symbol').notNull(),
  minorUnits: integer('minor_units').notNull().default(DEFAULT_MINOR_UNITS),
  isActive: boolean('is_active').notNull().default(true),
});

export const userSettings = pgTable('user_settings', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  primaryCurrency: char('primary_currency', { length: 3 })
    .notNull()
    .references(() => currencies.code),
  allowEmoji: boolean('allow_emoji').notNull().default(false),
  locale: text('locale').notNull().default('en-US'),
  periodRule: jsonb('period_rule')
    .$type<PeriodRuleValues>()
    .notNull()
    .default({ kind: 'calendar' }),
  weekendDays: integer('weekend_days').array().notNull().default(DefaultWeekendDays),
  seededVersion: integer('seeded_version'),
  showConvertedTotals: boolean('show_converted_totals').notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const accounts = pgTable(
  'accounts',
  {
    id: id(),
    userId: userId(),
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
    deletedAt: deletedAt(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  columns => [index('accounts_user_idx').on(columns.userId)]
);

export const categoryGroups = pgTable(
  'category_groups',
  {
    id: id(),
    userId: userId(),
    name: text('name').notNull(),
    kind: categoryKind('kind').notNull(),
    color: text('color').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    isSystem: boolean('is_system').notNull().default(false),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  columns => [index('category_groups_user_idx').on(columns.userId)]
);

export const categories = pgTable(
  'categories',
  {
    id: id(),
    userId: userId(),
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
  columns => [
    index('categories_user_idx').on(columns.userId),
    index('categories_group_idx').on(columns.groupId),
  ]
);

export const payees = pgTable(
  'payees',
  {
    id: id(),
    userId: userId(),
    name: text('name').notNull(),
    defaultCategoryId: text('default_category_id').references(() => categories.id),
    icon: text('icon'),
    color: text('color'),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  columns => [uniqueIndex('payees_user_name_key').on(columns.userId, columns.name)]
);

export const transactions = pgTable(
  'transactions',
  {
    id: id(),
    userId: userId(),
    accountId: text('account_id')
      .notNull()
      .references(() => accounts.id),
    categoryId: text('category_id').references(() => categories.id),
    payeeId: text('payee_id').references(() => payees.id),
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
    recurringSeriesId: text('recurring_series_id').references(() => recurringSeries.id),
    recurringDueOn: date('recurring_due_on', { mode: 'string' }),
    deletedAt: deletedAt(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  columns => [
    index('transactions_user_date_idx').on(columns.userId, columns.date),
    index('transactions_account_date_idx').on(columns.accountId, columns.date),
    index('transactions_user_category_idx').on(columns.userId, columns.categoryId),
    index('transactions_transfer_idx').on(columns.transferId),
    index('transactions_needs_review_idx')
      .on(columns.userId)
      .where(sql`${columns.needsReview} AND ${columns.deletedAt} IS NULL`),
    uniqueIndex('transactions_account_import_key')
      .on(columns.accountId, columns.importId)
      .where(sql`${columns.importId} IS NOT NULL AND ${columns.deletedAt} IS NULL`),
    check(
      'transactions_category_kind_check',
      sql`${columns.kind} = 'standard' OR ${columns.categoryId} IS NULL`
    ),
    check(
      'transactions_transfer_kind_check',
      sql`(${columns.kind} = 'transfer') = (${columns.transferId} IS NOT NULL)`
    ),
    check(
      'transactions_recurring_pair_check',
      sql`(${columns.recurringSeriesId} IS NULL) = (${columns.recurringDueOn} IS NULL)`
    ),
    uniqueIndex('transactions_recurring_occurrence_key')
      .on(columns.recurringSeriesId, columns.recurringDueOn)
      .where(sql`${columns.recurringSeriesId} IS NOT NULL AND ${columns.deletedAt} IS NULL`),
  ]
);

export const exchangeRates = pgTable(
  'exchange_rates',
  {
    userId: userId(),
    base: char('base', { length: 3 })
      .notNull()
      .references(() => currencies.code),
    quote: char('quote', { length: 3 })
      .notNull()
      .references(() => currencies.code),
    date: date('date', { mode: 'string' }).notNull(),
    rate: numeric('rate', { precision: 18, scale: 8 }).notNull(),
    source: text('source').notNull().default('manual'),
    deletedAt: deletedAt(),
    createdAt: createdAt(),
  },
  columns => [primaryKey({ columns: [columns.userId, columns.base, columns.quote, columns.date] })]
);

export const budgets = pgTable(
  'budgets',
  {
    id: id(),
    userId: userId(),
    categoryId: text('category_id')
      .notNull()
      .references(() => categories.id),
    month: date('month', { mode: 'string' }).notNull(),
    currency: char('currency', { length: 3 })
      .notNull()
      .references(() => currencies.code),
    amountMinor: bigint('amount_minor', { mode: 'number' }).notNull(),
    deletedAt: deletedAt(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  columns => [
    uniqueIndex('budgets_category_month_currency_key').on(
      columns.categoryId,
      columns.month,
      columns.currency
    ),
    index('budgets_user_month_idx').on(columns.userId, columns.month),
  ]
);

export const rules = pgTable(
  'rules',
  {
    id: id(),
    userId: userId(),
    name: text('name').notNull(),
    pattern: text('pattern').notNull(),
    categoryId: text('category_id')
      .notNull()
      .references(() => categories.id),
    priority: integer('priority').notNull().default(0),
    deletedAt: deletedAt(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  columns => [index('rules_user_idx').on(columns.userId)]
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
