'use client';

import './analytics.scss';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

import { Page, PageHeading } from '@/components/ui';
import {
  type AnalyticsFilters,
  analyticsHref,
  type AnalyticsParams,
  parseAnalyticsFilters,
} from '@/lib/analytics-filters';
import { FALLBACK_CURRENCY } from '@coinkeeper/shared/constants/money';
import { formatCompactMoney, formatMoney } from '@coinkeeper/shared/lib/money';

import { useCurrencyView } from '../currency-switch';
import { currentMonth, useAccounts, useSettings } from '../use-finance-data';
import { AnalyticsCashFlow } from './analytics-cash-flow';
import { type AnalyticsContext } from './analytics-context';
import { AnalyticsFilterBar } from './analytics-filter-bar';
import { AnalyticsOverview } from './analytics-overview';
import { AnalyticsPayees } from './analytics-payees';
import { AnalyticsSpending } from './analytics-spending';

export type AnalyticsView = 'cash-flow' | 'overview' | 'payees' | 'spending';

// keep order
export const AnalyticsViews: { label: string; path: string; view: AnalyticsView }[] = [
  {
    label: 'Overview',
    path: '/analytics',
    view: 'overview',
  },
  {
    label: 'Spending',
    path: '/analytics/spending',
    view: 'spending',
  },
  {
    label: 'Cash flow',
    path: '/analytics/cash-flow',
    view: 'cash-flow',
  },
  {
    label: 'Payees & accounts',
    path: '/analytics/payees',
    view: 'payees',
  },
];

const pathOf = (view: AnalyticsView) =>
  AnalyticsViews.find(item => item.view === view)?.path ?? AnalyticsViews[0].path;

function AnalyticsTabs({ filters, view }: { filters: AnalyticsFilters; view: AnalyticsView }) {
  return (
    <nav className="analytics__tabs" aria-label="Analytics sections">
      {AnalyticsViews.map(item => (
        <Link
          key={item.view}
          className="analytics__tab"
          href={analyticsHref(item.path, filters)}
          aria-current={item.view === view ? 'page' : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function AnalyticsBody({ context, view }: { context: AnalyticsContext; view: AnalyticsView }) {
  if (view === 'spending') return <AnalyticsSpending context={context} />;
  if (view === 'cash-flow') return <AnalyticsCashFlow context={context} />;
  if (view === 'payees') return <AnalyticsPayees context={context} />;

  return <AnalyticsOverview context={context} />;
}

function useAnalyticsCurrencies() {
  const accounts = useAccounts();
  const settings = useSettings();
  const primary = settings.data?.primaryCurrency ?? FALLBACK_CURRENCY;

  const currencies = useMemo(
    () => [...new Set([primary, ...(accounts.data ?? []).map(account => account.currency)])],
    [accounts.data, primary]
  );

  return { currencies, primary };
}

export function Analytics({ params, view }: { params: AnalyticsParams; view: AnalyticsView }) {
  const router = useRouter();
  const { currencies, primary } = useAnalyticsCurrencies();
  const [remembered, remember] = useCurrencyView(currencies, primary);
  const filters = parseAnalyticsFilters(params, currentMonth());

  const currency =
    filters.currency && currencies.includes(filters.currency) ? filters.currency : remembered;

  const update = (patch: Partial<AnalyticsFilters>) => {
    if (patch.currency) remember(patch.currency);
    router.replace(
      analyticsHref(pathOf(view), {
        ...filters,
        currency,
        ...patch,
      }),
      {
        scroll: false,
      }
    );
  };

  const context: AnalyticsContext = {
    currency,
    filters,
    format: value => formatMoney(value, currency),
    formatTick: value => formatCompactMoney(value, currency),
  };

  return (
    <Page>
      <PageHeading
        title="Analytics"
        description="Where your money comes from and goes, one currency and period at a time."
        actions={
          <AnalyticsFilterBar
            currencies={currencies}
            currency={currency}
            filters={filters}
            primary={primary}
            onChange={update}
          />
        }
      />
      <AnalyticsTabs filters={{ ...filters, currency }} view={view} />
      <AnalyticsBody context={context} view={view} />
    </Page>
  );
}
