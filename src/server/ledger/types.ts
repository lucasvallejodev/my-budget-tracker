import type { transactions } from '@/db/schema';

export type TransactionRow = {
  accountCurrency: string;
  accountId: string;
  accountName: string;
  amountMinor: number;
  categoryIcon: string | null;
  categoryId: string | null;
  categoryName: string | null;
  counterpartAccountId: string | null;
  counterpartAccountName: string | null;
  currency: string;
  date: string;
  excluded: boolean;
  groupColor: string | null;
  groupId: string | null;
  groupKind: 'income' | 'expense' | null;
  groupName: string | null;
  id: string;
  importId: string | null;
  kind: 'standard' | 'transfer' | 'opening';
  memo: string;
  needsReview: boolean;
  originalPayee: string | null;
  payeeId: string | null;
  payeeName: string | null;
  status: 'pending' | 'cleared' | 'reconciled';
  transferId: string | null;
};

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
