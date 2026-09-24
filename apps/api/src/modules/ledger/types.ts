import type { transactions } from '@/db/schema';
import type { TransactionRow, Transfer } from '@coinkeeper/shared/schema/transaction';

export type { TransactionRow, Transfer };

export type ListFilters = {
  accountId?: string;
  categoryId?: string;
  cursor?: string;
  deleted?: boolean;
  from?: string;
  ids?: string[];
  includeDeleted?: boolean;
  kind?: TransactionRow['kind'];
  limit?: number;
  month?: string;
  needsReview?: boolean;
  search?: string;
  to?: string;
  transferId?: string;
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

export type TransferPatch = {
  memo?: string;
  status?: TransactionRow['status'];
};

export type TransactionRecord = typeof transactions.$inferSelect;

export type TransactionPatch = Partial<typeof transactions.$inferInsert>;
