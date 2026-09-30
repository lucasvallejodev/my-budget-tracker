'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { apiGet, apiList } from '@/api/client';
import { ISO_MONTH_LENGTH } from '@coinkeeper/shared/constants/time';
import { localIsoMonth } from '@coinkeeper/shared/lib/date-helpers';
import type { AccountSummary } from '@coinkeeper/shared/schema/accounts';
import type { Session, User } from '@coinkeeper/shared/schema/auth';
import type { BudgetRow, BudgetSuggestion } from '@coinkeeper/shared/schema/budgets';
import type { CategoryTree } from '@coinkeeper/shared/schema/categories';
import type { PageResponse } from '@coinkeeper/shared/schema/common';
import type { Currency } from '@coinkeeper/shared/schema/currencies';
import type { ExchangeRateRow } from '@coinkeeper/shared/schema/exchange-rates';
import type { PayeeRow } from '@coinkeeper/shared/schema/payees';
import type {
  BalancePoint,
  CashPoint,
  CategoryMonthSlice,
  CategorySlice,
  GroupMonthSlice,
  GroupSlice,
  RankingSlice,
  Summary,
} from '@coinkeeper/shared/schema/reports';
import type { RuleRow } from '@coinkeeper/shared/schema/rules';
import type { UserSettings } from '@coinkeeper/shared/schema/settings';
import type { ReviewSuggestion, TransactionRow } from '@coinkeeper/shared/schema/transaction';

export type {
  AccountSummary,
  BalancePoint,
  BudgetRow,
  CashPoint,
  CategoryMonthSlice,
  CategorySlice,
  CategoryTree,
  ExchangeRateRow,
  GroupMonthSlice,
  GroupSlice,
  PayeeRow,
  ReviewSuggestion,
  RuleRow,
  Session,
  Summary,
  TransactionRow,
  User,
};

type TransactionParams = Record<string, string | undefined>;

export type BreakdownParams = {
  currency?: string;
  month: string;
  months: number;
};

export type BreakdownItems = {
  account: RankingSlice;
  category: CategorySlice;
  categoryByMonth: CategoryMonthSlice;
  group: GroupSlice;
  groupByMonth: GroupMonthSlice;
  payee: RankingSlice;
};

const BreakdownQueries: Record<keyof BreakdownItems, { by: string; split?: string }> = {
  account: { by: 'account' },
  category: { by: 'category' },
  categoryByMonth: { by: 'category', split: 'month' },
  group: { by: 'group' },
  groupByMonth: { by: 'group', split: 'month' },
  payee: { by: 'payee' },
};

export const QueryKeys = {
  accounts: ['accounts'] as const,
  balances: (months: number) => ['summary', 'balances', months] as const,
  breakdown: (kind: string, params: BreakdownParams) =>
    ['summary', 'breakdown', kind, params] as const,
  budgets: (month: string) => ['budgets', month] as const,
  budgetSuggestions: (month: string) => ['budgets', 'suggestions', month] as const,
  cashFlow: (month: string, months: number) => ['summary', 'cash-flow', month, months] as const,
  categories: ['categories'] as const,
  categoryBreakdown: (month: string, currency: string) =>
    ['summary', 'breakdown', 'category', month, currency] as const,
  currencies: ['currencies'] as const,
  deleted: (resource: string) => ['deleted', resource] as const,
  exchangeRates: ['exchange-rates'] as const,
  me: ['me'] as const,
  payees: ['payees'] as const,
  reviewSuggestions: ['transactions', 'review-suggestions'] as const,
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

export function useBudgetSuggestions(month: string) {
  return useQuery({
    queryFn: () => apiList<BudgetSuggestion>('/budgets/suggestions', { month }),
    queryKey: QueryKeys.budgetSuggestions(month),
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

export function useBreakdown<Kind extends keyof BreakdownItems>(
  kind: Kind,
  params: BreakdownParams
) {
  return useQuery({
    queryFn: () =>
      apiList<BreakdownItems[Kind]>('/reports/breakdown', {
        ...BreakdownQueries[kind],
        currency: params.currency,
        month: params.month,
        months: String(params.months),
      }),
    queryKey: QueryKeys.breakdown(kind, params),
  });
}

export function useCashFlow(month: string, months: number) {
  return useQuery({
    queryFn: () => apiList<CashPoint>('/reports/cash-flow', { month, months: String(months) }),
    queryKey: QueryKeys.cashFlow(month, months),
  });
}

export function useCategoryBreakdown(month: string, currency: string) {
  return useQuery({
    queryFn: () =>
      apiList<CategorySlice>('/reports/breakdown', {
        by: 'category',
        currency,
        month,
      }),
    queryKey: QueryKeys.categoryBreakdown(month, currency),
  });
}

export function useBalances(months: number) {
  return useQuery({
    queryFn: () => apiList<BalancePoint>('/reports/balances', { months: String(months) }),
    queryKey: QueryKeys.balances(months),
  });
}

export function useSummary(month?: string) {
  return useQuery({
    queryFn: () => apiGet<Summary>('/reports/summary', { month }),
    queryKey: QueryKeys.summary(month),
  });
}

export function useAllowEmoji() {
  return (
    useQuery({
      queryFn: () => apiGet<UserSettings>('/settings'),
      queryKey: QueryKeys.settings,
      select: settings => settings.allowEmoji,
    }).data === true
  );
}

export function useReviewSuggestions() {
  return useQuery({
    queryFn: () => apiList<ReviewSuggestion>('/transactions/review-suggestions'),
    queryKey: QueryKeys.reviewSuggestions,
  });
}

export function useNeedsReviewCount() {
  return useQuery({
    queryFn: () => apiGet<Summary>('/reports/summary', {}),
    queryKey: QueryKeys.summary(),
    select: summary => summary.needsReviewCount,
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
  return localIsoMonth(new Date());
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
