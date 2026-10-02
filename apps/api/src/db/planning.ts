import { sql } from 'drizzle-orm';
import {
  bigint,
  char,
  check,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

import {
  createdAt,
  deletedAt,
  id,
  recurringCadence,
  recurringKind,
  recurringRecordMode,
  recurringSource,
  recurringStatus,
  transactionKind,
  updatedAt,
  userId,
} from './columns';
import { accounts, categories, currencies, payees, transactions } from './schema';

const DEFAULT_MATCH_WINDOW_DAYS = 3;

export const recurringSeries = pgTable(
  'recurring_series',
  {
    accountId: text('account_id')
      .notNull()
      .references(() => accounts.id),
    amountMaxMinor: bigint('amount_max_minor', { mode: 'number' }),
    amountMinMinor: bigint('amount_min_minor', { mode: 'number' }),
    amountMinor: bigint('amount_minor', { mode: 'number' }).notNull(),
    anchorDate: date('anchor_date', { mode: 'string' }).notNull(),
    cadence: recurringCadence('cadence').notNull().default('monthly'),
    categoryId: text('category_id').references(() => categories.id),
    createdAt: createdAt(),
    currency: char('currency', { length: 3 })
      .notNull()
      .references(() => currencies.code),
    deletedAt: deletedAt(),
    endDate: date('end_date', { mode: 'string' }),
    id: id(),
    interval: integer('interval').notNull().default(1),
    kind: recurringKind('kind').notNull().default('bill'),
    matchWindowDays: integer('match_window_days').notNull().default(DEFAULT_MATCH_WINDOW_DAYS),
    name: text('name').notNull(),
    payeeId: text('payee_id').references(() => payees.id),
    recordMode: recurringRecordMode('record_mode').notNull().default('match_only'),
    source: recurringSource('source').notNull().default('manual'),
    status: recurringStatus('status').notNull().default('active'),
    updatedAt: updatedAt(),
    userId: userId(),
  },
  columns => [
    index('recurring_series_user_idx').on(columns.userId),
    check('recurring_series_amount_check', sql`${columns.amountMinor} <> 0`),
    check('recurring_series_interval_check', sql`${columns.interval} >= 1`),
    check('recurring_series_window_check', sql`${columns.matchWindowDays} >= 0`),
  ]
);

export const transactionSplits = pgTable(
  'transaction_splits',
  {
    amountMinor: bigint('amount_minor', { mode: 'number' }).notNull(),
    categoryId: text('category_id').references(() => categories.id),
    createdAt: createdAt(),
    deletedAt: deletedAt(),
    id: id(),
    memo: text('memo').notNull().default(''),
    sortOrder: integer('sort_order').notNull().default(0),
    transactionId: text('transaction_id')
      .notNull()
      .references(() => transactions.id),
    updatedAt: updatedAt(),
    userId: userId(),
  },
  columns => [
    index('transaction_splits_transaction_idx')
      .on(columns.transactionId)
      .where(sql`${columns.deletedAt} IS NULL`),
    index('transaction_splits_user_category_idx').on(columns.userId, columns.categoryId),
    check('transaction_splits_amount_check', sql`${columns.amountMinor} <> 0`),
  ]
);

export const transactionTemplates = pgTable(
  'transaction_templates',
  {
    accountId: text('account_id').references(() => accounts.id),
    amountMinor: bigint('amount_minor', { mode: 'number' }),
    categoryId: text('category_id').references(() => categories.id),
    createdAt: createdAt(),
    deletedAt: deletedAt(),
    id: id(),
    kind: transactionKind('kind').notNull().default('standard'),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    memo: text('memo').notNull().default(''),
    name: text('name').notNull(),
    payeeId: text('payee_id').references(() => payees.id),
    sortOrder: integer('sort_order').notNull().default(0),
    transferAccountId: text('transfer_account_id').references(() => accounts.id),
    updatedAt: updatedAt(),
    userId: userId(),
  },
  columns => [
    index('transaction_templates_user_idx').on(columns.userId),
    uniqueIndex('transaction_templates_user_name_key')
      .on(columns.userId, columns.name)
      .where(sql`${columns.deletedAt} IS NULL`),
    check('transaction_templates_kind_check', sql`${columns.kind} IN ('standard', 'transfer')`),
    check(
      'transaction_templates_category_kind_check',
      sql`${columns.kind} = 'standard' OR ${columns.categoryId} IS NULL`
    ),
    check(
      'transaction_templates_transfer_account_check',
      sql`(${columns.kind} = 'transfer') OR ${columns.transferAccountId} IS NULL`
    ),
    check(
      'transaction_templates_amount_account_check',
      sql`${columns.amountMinor} IS NULL OR ${columns.accountId} IS NOT NULL`
    ),
  ]
);

export const budgetPeriodStarts = pgTable(
  'budget_period_starts',
  {
    createdAt: createdAt(),
    deletedAt: deletedAt(),
    id: id(),
    periodKey: text('period_key').notNull(),
    startsOn: date('starts_on', { mode: 'string' }).notNull(),
    updatedAt: updatedAt(),
    userId: userId(),
  },
  columns => [
    uniqueIndex('budget_period_starts_user_key')
      .on(columns.userId, columns.periodKey)
      .where(sql`${columns.deletedAt} IS NULL`),
  ]
);
