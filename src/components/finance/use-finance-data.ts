'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { ISO_MONTH_LENGTH } from '@/constants/time';
import type { BudgetRow } from '@/server/budgets/service';

export type { BudgetRow };
import type { Currency, UserSettings } from '@/db/schema';
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

export type { AccountSummary, CategoryTree, TransactionRow };
export type PayeeRow = {
  defaultCategoryId: string | null;
  id: string;
  name: string;
};
export type Summary = {
  accounts: AccountSummary[];
  breakdown: GroupSlice[];
  cashFlow: CashPoint[];
  converted: ConvertedTotals | null;
  month: string;
  needsReviewCount: number;
  netWorth: NetWorthBucket[];
  totals: CurrencyTotals[];
};
export type ExchangeRateRow = {
  base: string;
  date: string;
  quote: string;
  rate: number;
  source: string;
};

async function fetchFinance<T>(url: string): Promise<T> {
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

export const QueryKeys = {
  accounts: ['accounts'] as const,
  categories: ['categories'] as const,
  currencies: ['currencies'] as const,
  exchangeRates: ['exchange-rates'] as const,
  payees: ['payees'] as const,
  settings: ['settings'] as const,
  summary: (month?: string) => ['summary', month ?? 'current'] as const,
  transactions: (params: Record<string, string | undefined> = {}) =>
    ['transactions', params] as const,
};

export function useAccounts(includeArchived = false) {
  return useQuery({
    queryFn: () =>
      fetchFinance<AccountSummary[]>(`/api/accounts${includeArchived ? '?includeArchived=1' : ''}`),
    queryKey: [...QueryKeys.accounts, includeArchived],
  });
}

export function usePayees() {
  return useQuery({
    queryFn: () => fetchFinance<PayeeRow[]>('/api/payees'),
    queryKey: QueryKeys.payees,
  });
}

export function useCategories(includeArchived = false) {
  return useQuery({
    queryFn: () =>
      fetchFinance<CategoryTree[]>(`/api/categories${includeArchived ? '?includeArchived=1' : ''}`),
    queryKey: [...QueryKeys.categories, includeArchived],
  });
}

export function useCurrencies() {
  return useQuery({
    queryFn: () => fetchFinance<Currency[]>('/api/currencies'),
    queryKey: QueryKeys.currencies,
    staleTime: Infinity,
  });
}

export function useSettings() {
  return useQuery({
    queryFn: () => fetchFinance<UserSettings>('/api/settings'),
    queryKey: QueryKeys.settings,
  });
}

export type RuleRow = {
  categoryId: string;
  categoryName: string | null;
  id: string;
  name: string;
  pattern: string;
  priority: number;
};

export function useBudgets(month: string) {
  return useQuery({
    queryFn: () => fetchFinance<BudgetRow[]>(`/api/budgets?month=${month}`),
    queryKey: ['budgets', month],
  });
}

export function useRules() {
  return useQuery({ queryFn: () => fetchFinance<RuleRow[]>('/api/rules'), queryKey: ['rules'] });
}

export function useExchangeRates() {
  return useQuery({
    queryFn: () => fetchFinance<ExchangeRateRow[]>('/api/exchange-rates'),
    queryKey: QueryKeys.exchangeRates,
  });
}

export function useTransactions(params: Record<string, string | undefined> = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter((entry): entry is [string, string] => !!entry[1])
  ).toString();

  return useQuery({
    queryFn: () =>
      fetchFinance<TransactionRow[]>(query ? `/api/transactions?${query}` : '/api/transactions'),
    queryKey: QueryKeys.transactions(params),
  });
}

export function useSummary(month?: string) {
  return useQuery({
    queryFn: () =>
      fetchFinance<Summary>(month ? `/api/reports/summary?month=${month}` : '/api/reports/summary'),
    queryKey: QueryKeys.summary(month),
  });
}

export const FinanceKeys = [
  'accounts',
  'payees',
  'categories',
  'transactions',
  'summary',
  'settings',
];

export function currentMonth() {
  return new Date().toISOString().slice(0, ISO_MONTH_LENGTH);
}

export function shiftMonth(month: string, delta: number) {
  const [year, monthIndex] = month.split('-').map(Number);

  return new Date(Date.UTC(year, monthIndex - 1 + delta, 1))
    .toISOString()
    .slice(0, ISO_MONTH_LENGTH);
}

export function monthLabel(month: string) {
  const [year, monthIndex] = month.split('-').map(Number);

  return new Date(Date.UTC(year, monthIndex - 1, 1)).toLocaleDateString('en-US', {
    month: 'long',
    timeZone: 'UTC',
    year: 'numeric',
  });
}

export function useRefreshFinance() {
  const queryClient = useQueryClient();

  return () =>
    Promise.all(FinanceKeys.map(key => queryClient.invalidateQueries({ queryKey: [key] })));
}
