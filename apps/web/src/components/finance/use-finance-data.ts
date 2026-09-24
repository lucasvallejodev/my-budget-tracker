'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { ISO_MONTH_LENGTH } from '@coinkeeper/shared/constants/time';
import type { AccountSummary } from '@coinkeeper/shared/schema/accounts';
import type { BudgetRow } from '@coinkeeper/shared/schema/budgets';
import type { CategoryTree } from '@coinkeeper/shared/schema/categories';
import type { Currency } from '@coinkeeper/shared/schema/currencies';
import type { ExchangeRateRow } from '@coinkeeper/shared/schema/exchange-rates';
import type { PayeeRow } from '@coinkeeper/shared/schema/payees';
import type { Summary } from '@coinkeeper/shared/schema/reports';
import type { RuleRow } from '@coinkeeper/shared/schema/rules';
import type { UserSettings } from '@coinkeeper/shared/schema/settings';
import type { TransactionRow } from '@coinkeeper/shared/schema/transaction';

export type {
  AccountSummary,
  BudgetRow,
  CategoryTree,
  ExchangeRateRow,
  PayeeRow,
  RuleRow,
  Summary,
  TransactionRow,
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
  budgets: (month: string) => ['budgets', month] as const,
  categories: ['categories'] as const,
  currencies: ['currencies'] as const,
  exchangeRates: ['exchange-rates'] as const,
  payees: ['payees'] as const,
  rules: ['rules'] as const,
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

export function useBudgets(month: string) {
  return useQuery({
    queryFn: () => fetchFinance<BudgetRow[]>(`/api/budgets?month=${month}`),
    queryKey: QueryKeys.budgets(month),
  });
}

export function useRules() {
  return useQuery({
    queryFn: () => fetchFinance<RuleRow[]>('/api/rules'),
    queryKey: QueryKeys.rules,
  });
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
  'budgets',
  'categories',
  'exchange-rates',
  'payees',
  'rules',
  'settings',
  'summary',
  'transactions',
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
