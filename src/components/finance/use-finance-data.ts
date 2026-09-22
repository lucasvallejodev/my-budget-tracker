'use client';
import { useQuery } from '@tanstack/react-query';
import type { AccountSummary } from '@/server/accounts/service';
import type { CategoryTree } from '@/server/categories/service';
import type { TransactionRow } from '@/server/ledger/service';
import type {
  CashPoint,
  ConvertedTotals,
  CurrencyTotals,
  GroupSlice,
  NetWorthBucket,
} from '@/server/reports/service';
import type { Currency, UserSettings } from '@/db/schema';

export type { AccountSummary, CategoryTree, TransactionRow };
export type PayeeRow = { id: string; name: string; defaultCategoryId: string | null };
export type Summary = {
  month: string;
  totals: CurrencyTotals[];
  breakdown: GroupSlice[];
  netWorth: NetWorthBucket[];
  cashFlow: CashPoint[];
  needsReviewCount: number;
  accounts: AccountSummary[];
  converted: ConvertedTotals | null;
};
export type ExchangeRateRow = {
  base: string;
  quote: string;
  date: string;
  rate: number;
  source: string;
};

export async function fetchFinance<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    let message = 'Unable to load financial data. Please try again.';
    try {
      message = ((await response.json()) as { error?: string }).error ?? message;
    } catch {}
    throw new Error(message);
  }
  return (await response.json()) as T;
}

export const queryKeys = {
  accounts: ['accounts'] as const,
  payees: ['payees'] as const,
  categories: ['categories'] as const,
  currencies: ['currencies'] as const,
  settings: ['settings'] as const,
  exchangeRates: ['exchange-rates'] as const,
  transactions: (params: Record<string, string | undefined> = {}) =>
    ['transactions', params] as const,
  summary: (month?: string) => ['summary', month ?? 'current'] as const,
};

export function useAccounts(includeArchived = false) {
  return useQuery({
    queryKey: [...queryKeys.accounts, includeArchived],
    queryFn: () =>
      fetchFinance<AccountSummary[]>(`/api/accounts${includeArchived ? '?includeArchived=1' : ''}`),
  });
}
export function usePayees() {
  return useQuery({
    queryKey: queryKeys.payees,
    queryFn: () => fetchFinance<PayeeRow[]>('/api/payees'),
  });
}
export function useCategories(includeArchived = false) {
  return useQuery({
    queryKey: [...queryKeys.categories, includeArchived],
    queryFn: () =>
      fetchFinance<CategoryTree[]>(`/api/categories${includeArchived ? '?includeArchived=1' : ''}`),
  });
}
export function useCurrencies() {
  return useQuery({
    queryKey: queryKeys.currencies,
    queryFn: () => fetchFinance<Currency[]>('/api/currencies'),
    staleTime: Infinity,
  });
}
export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: () => fetchFinance<UserSettings>('/api/settings'),
  });
}
export function useExchangeRates() {
  return useQuery({
    queryKey: queryKeys.exchangeRates,
    queryFn: () => fetchFinance<ExchangeRateRow[]>('/api/exchange-rates'),
  });
}
export function useTransactions(params: Record<string, string | undefined> = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter((entry): entry is [string, string] => !!entry[1])
  ).toString();
  return useQuery({
    queryKey: queryKeys.transactions(params),
    queryFn: () => fetchFinance<TransactionRow[]>(`/api/transactions${query ? `?${query}` : ''}`),
  });
}
export function useSummary(month?: string) {
  return useQuery({
    queryKey: queryKeys.summary(month),
    queryFn: () => fetchFinance<Summary>(`/api/reports/summary${month ? `?month=${month}` : ''}`),
  });
}

/** Query keys every mutation invalidates; cheap enough for a personal app. */
export const FINANCE_KEYS = [
  'accounts',
  'payees',
  'categories',
  'transactions',
  'summary',
  'settings',
];

export function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}
export function shiftMonth(month: string, delta: number) {
  const [year, monthIndex] = month.split('-').map(Number);
  return new Date(Date.UTC(year, monthIndex - 1 + delta, 1)).toISOString().slice(0, 7);
}
export function monthLabel(month: string) {
  const [year, monthIndex] = month.split('-').map(Number);
  return new Date(Date.UTC(year, monthIndex - 1, 1)).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
