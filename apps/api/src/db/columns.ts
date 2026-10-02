import { pgEnum, text, timestamp } from 'drizzle-orm/pg-core';

import {
  AccountClassificationValues,
  AccountTypeValues,
  CategoryKindValues,
  RecurringCadenceValues,
  RecurringKindValues,
  RecurringRecordModeValues,
  RecurringSourceValues,
  RecurringStatusValues,
  TransactionKindValues,
  TransactionStatusValues,
} from '@coinkeeper/shared/schema/enums';

export const accountType = pgEnum('account_type', AccountTypeValues);
export const accountClassification = pgEnum('account_classification', AccountClassificationValues);
export const categoryKind = pgEnum('category_kind', CategoryKindValues);
export const transactionKind = pgEnum('transaction_kind', TransactionKindValues);
export const transactionStatus = pgEnum('transaction_status', TransactionStatusValues);
export const recurringKind = pgEnum('recurring_kind', RecurringKindValues);
export const recurringCadence = pgEnum('recurring_cadence', RecurringCadenceValues);
export const recurringRecordMode = pgEnum('recurring_record_mode', RecurringRecordModeValues);
export const recurringSource = pgEnum('recurring_source', RecurringSourceValues);
export const recurringStatus = pgEnum('recurring_status', RecurringStatusValues);

export const id = () =>
  text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

export const createdAt = () =>
  timestamp('created_at', { withTimezone: true }).notNull().defaultNow();

export const updatedAt = () =>
  timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

export const deletedAt = () => timestamp('deleted_at', { withTimezone: true });
