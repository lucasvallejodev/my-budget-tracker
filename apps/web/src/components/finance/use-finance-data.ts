'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { apiGet, apiList } from '@/api/client';
import { ISO_MONTH_LENGTH } from '@coinkeeper/shared/constants/time';
import type { AccountSummary } from '@coinkeeper/shared/schema/accounts';
import type { Session, User } from '@coinkeeper/shared/schema/auth';
import type { BudgetRow } from '@coinkeeper/shared/schema/budgets';
import type { CategoryTree } from '@coinkeeper/shared/schema/categories';
import type { PageResponse } from '@coinkeeper/shared/schema/common';
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
  Session,
  Summary,
  TransactionRow,
  User,
};

type TransactionParams = Record<string, string | undefined>;

export const QueryKeys = {
  accounts: ['accounts'] as const,
  budgets: (month: string) => ['budgets', month] as const,
  categories: ['categories'] as const,
  currencies: ['currencies'] as const,
  deleted: (resource: string) => ['deleted', resource] as const,
  exchangeRates: ['exchange-rates'] as const,
  me: ['me'] as const,
  payees: ['payees'] as const,
  rules: ['rules'] as const,
  sessions: ['sessions'] as const,
  settings: ['settings'] as const,
  summary: (month?: string) => ['summary', month ?? 'current'] as const,
  transactions: (params: TransactionParams = {}) => ['transactions', params] as const,
};

export function useAccounts(includeArchived = false) {
  return useQuery({
    queryFn: () => apiList<AccountSummary>('/accounts', { includeArchived }),
    queryKey: [...QueryKeys.accounts, includeArchived],
  });
}

export function usePayees() {
  return useQuery({
    queryFn: () => apiList<PayeeRow>('/payees'),
    queryKey: QueryKeys.payees,
  });
}

export function useCategories(includeArchived = false) {
  return useQuery({
    queryFn: () => apiList<CategoryTree>('/category-groups', { includeArchived }),
    queryKey: [...QueryKeys.categories, includeArchived],
  });
}

export function useCurrencies() {
  return useQuery({
    queryFn: () => apiList<Currency>('/currencies'),
    queryKey: QueryKeys.currencies,
    staleTime: Infinity,
  });
}

export function useSettings() {
  return useQuery({
    queryFn: () => apiGet<UserSettings>('/settings'),
    queryKey: QueryKeys.settings,
  });
}

export function useBudgets(month: string) {
  return useQuery({
    queryFn: () => apiList<BudgetRow>('/budgets', { month }),
    queryKey: QueryKeys.budgets(month),
  });
}

export function useRules() {
  return useQuery({
    queryFn: () => apiList<RuleRow>('/rules'),
    queryKey: QueryKeys.rules,
  });
}

export function useExchangeRates() {
  return useQuery({
    queryFn: () => apiList<ExchangeRateRow>('/exchange-rates'),
    queryKey: QueryKeys.exchangeRates,
  });
}

export function useTransactions(params: TransactionParams = {}) {
  return useQuery({
    queryFn: async () =>
      (await apiGet<PageResponse<TransactionRow>>('/transactions', params)).items,
    queryKey: QueryKeys.transactions(params),
  });
}

export function useSummary(month?: string) {
  return useQuery({
    queryFn: () => apiGet<Summary>('/reports/summary', { month }),
    queryKey: QueryKeys.summary(month),
  });
}

export function useCurrentUser({ enabled = true } = {}) {
  return useQuery({
    enabled,
    queryFn: () => apiGet<User>('/me'),
    queryKey: QueryKeys.me,
    staleTime: Infinity,
  });
}

export function useSessions() {
  return useQuery({
    queryFn: () => apiList<Session>('/me/sessions'),
    queryKey: QueryKeys.sessions,
  });
}

export function useDeletedTransactions() {
  return useQuery({
    queryFn: async () =>
      (await apiGet<PageResponse<TransactionRow>>('/transactions', { deleted: true })).items,
    queryKey: QueryKeys.deleted('transactions'),
  });
}

export function useDeletedAccounts() {
  return useQuery({
    queryFn: () => apiList<AccountSummary>('/accounts', { deleted: true }),
    queryKey: QueryKeys.deleted('accounts'),
  });
}

export function useDeletedRules() {
  return useQuery({
    queryFn: () => apiList<RuleRow>('/rules', { deleted: true }),
    queryKey: QueryKeys.deleted('rules'),
  });
}

export function useDeletedExchangeRates() {
  return useQuery({
    queryFn: () => apiList<ExchangeRateRow>('/exchange-rates', { deleted: true }),
    queryKey: QueryKeys.deleted('exchange-rates'),
  });
}

export const FinanceKeys = [
  'accounts',
  'budgets',
  'categories',
  'deleted',
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
