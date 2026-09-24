import type { transactions } from '@/db/schema';
import type { TransactionRow } from '@/schema/transaction';

export type { TransactionRow };

export type ListFilters = {
  accountId?: string;
  categoryId?: string;
  from?: string;
  ids?: string[];
  kind?: TransactionRow['kind'];
  limit?: number;
  month?: string;
  needsReview?: boolean;
  offset?: number;
  search?: string;
  to?: string;
};

export type StandardInput = {
  accountId: string;
  amountMinor: number;
  categoryId?: string | null;
  date: string;
  excluded?: boolean;
  importId?: string | null;
  memo?: string;
  needsReview?: boolean;
  originalPayee?: string | null;
  payeeId?: string | null;
  status?: TransactionRow['status'];
};

export type TransferInput = {
  amountFromMinor: number;
  amountToMinor?: number;
  date: string;
  fromAccountId: string;
  memo?: string;
  status?: TransactionRow['status'];
  toAccountId: string;
};

export type TransactionRecord = typeof transactions.$inferSelect;

export type TransactionPatch = Partial<typeof transactions.$inferInsert>;
