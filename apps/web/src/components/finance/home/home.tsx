'use client';

import './home.scss';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import {
  Button,
  Cluster,
  EmptyState,
  Notice,
  Page,
  PageHeading,
  Panel,
  QueryContent,
  Stat,
} from '@/components/ui';
import { FALLBACK_CURRENCY } from '@coinkeeper/shared/constants/money';
import { localIsoDate } from '@coinkeeper/shared/lib/date-helpers';
import { formatCompactMoney, formatMoney } from '@coinkeeper/shared/lib/money';
import { type BudgetPeriod, calendarPeriod, periodProgress } from '@coinkeeper/shared/lib/periods';

import { AttentionStrip } from '../attention-strip';
import { type BudgetFigures, budgetFigures } from '../budget-status';
import { CashFlowChart } from '../cash-flow-chart';
import { describeConversion } from '../conversion';
import { ConvertedView, CurrencySwitch, useCurrencyView } from '../currency-switch';
import { LeftToSpend } from '../left-to-spend';
import { MonthPicker } from '../month-picker';
import { netWorthAt } from '../net-worth';
import { groupSpendingSlices, hasSpendingIn, SpendingBars } from '../spending-bars';
import { longDayLabel } from '../transaction-labels';
import { TransactionTable } from '../transaction-table';
import {
  type BalancePoint,
  type BudgetRow,
  currentMonth,
  monthLabel,
  shiftMonth,
  type Summary,
  useBalances,
  useBudgets,
  useSettings,
  useSummary,
  useTransactions,
} from '../use-finance-data';
import { BudgetsToWatch } from './budgets-to-watch';
import { attentionItems, heroTotals } from './home-figures';
import { HomeHero } from './home-hero';
import { NetWorthCard } from './net-worth-card';

const BalanceMonths = 6;
const CashFlowMonths = 6;
const RecentLimit = '6';
const MonthNameLength = 3;

const currenciesOf = (summary: Summary | undefined) => [
  ...new Set([
    ...(summary?.totals ?? []).map(total => total.currency),
    ...(summary?.netWorth ?? []).map(bucket => bucket.currency),
  ]),
];

const homeDescription = (month: string, today: string, period?: BudgetPeriod) => {
  if (month !== currentMonth()) return monthLabel(month);

  const daysLeft = periodProgress(period ?? calendarPeriod(month), today).daysLeft;

  return `${longDayLabel(today)} · ${daysLeft} day${daysLeft === 1 ? '' : 's'} left this month`;
};

const cashFlowPoints = (summary: Summary, currency: string) =>
  summary.cashFlow
    .filter(point => point.currency === currency)
    .sort((left, right) => left.month.localeCompare(right.month))
    .slice(-CashFlowMonths)
    .map(point => ({
      expense: point.spendingMinor,
      income: point.incomeMinor,
      label: monthLabel(point.month).slice(0, MonthNameLength),
    }));

function RecentActivity({ currency, month }: { currency?: string; month: string }) {
  const recent = useTransactions({
    currency,
    limit: RecentLimit,
    month,
  });

  return (
    <Panel
      title="Recent activity"
      action={
        <Button asChild variant="ghost" size="sm">
          <Link href="/transactions">
            All transactions <ArrowRight aria-hidden />
          </Link>
        </Button>
      }
    >
      <QueryContent pending={recent.isPending} loading="Loading…">
        {() => <TransactionTable transactions={recent.data ?? []} showAccount={false} />}
      </QueryContent>
    </Panel>
  );
}

function ConvertedOverview({
  converted,
  currencies,
  onViewChange,
}: {
  converted: NonNullable<Summary['converted']>;
  currencies: string[];
  onViewChange: (view: string) => void;
}) {
  const format = (value: number) => formatMoney(value, converted.currency);

  return (
    <Panel title={`≈ All in ${converted.currency}`} description={describeConversion(converted)}>
      <div className="home__figures">
        <Stat label="Income" value={format(converted.incomeMinor)} />
        <Stat label="Spending" value={format(converted.spendingMinor)} />
        <Stat label="Kept" value={format(converted.incomeMinor - converted.spendingMinor)} />
      </div>
      {converted.missing.length > 0 && (
        <Notice role="status">
          No rate to {converted.currency} for {converted.missing.join(', ')}; those amounts are left
          out. <Link href="/settings/currencies">Add rates</Link>
        </Notice>
      )}
      <p className="home__converted-note">
        Spending by group, budgets and cash flow are shown one currency at a time.
      </p>
      <Cluster>
        {currencies.map(code => (
          <Button key={code} variant="outline" size="sm" onClick={() => onViewChange(code)}>
            See {code} in detail
          </Button>
        ))}
      </Cluster>
    </Panel>
  );
}

function useHomeData(month: string) {
  const summary = useSummary(month);
  const previous = useSummary(shiftMonth(month, -1));
  const budgets = useBudgets(month);
  const balances = useBalances(BalanceMonths, month);
  const settings = useSettings();

  return {
    balances,
    budgets,
    previous,
    settings,
    summary,
  };
}

export function Home() {
  const today = localIsoDate(new Date());
  const [month, setMonth] = useState(currentMonth());
  const { balances, budgets, previous, settings, summary } = useHomeData(month);
  const currencies = currenciesOf(summary.data);
  const primary = settings.data?.primaryCurrency ?? FALLBACK_CURRENCY;
  const [view, setView] = useCurrencyView(currencies, primary, !!summary.data?.converted);

  return (
    <Page>
      <PageHeading
        title="Home"
        description={homeDescription(month, today, summary.data?.period)}
        actions={
          <>
            <CurrencySwitch
              converted={!!summary.data?.converted}
              currencies={currencies}
              primary={primary}
              value={view}
              onChange={setView}
            />
            <MonthPicker month={month} onChange={setMonth} />
          </>
        }
      />
      <QueryContent
        pending={summary.isPending}
        error={summary.isError}
        loading="Loading your finances…"
        errorTitle="Could not load your finances"
        onRetry={() => void summary.refetch()}
        empty={
          !currencies.length && (
            <EmptyState
              title="No activity yet"
              description="Create an account and record your first transaction to see your numbers here."
            />
          )
        }
      >
        {() => (
          <HomeContent
            balances={balances.data ?? []}
            budgets={budgets.data ?? []}
            currencies={currencies}
            onViewChange={setView}
            month={month}
            previous={previous.data}
            summary={summary.data!}
            today={today}
            view={view}
          />
        )}
      </QueryContent>
    </Page>
  );
}

type HomeContentProps = {
  balances: BalancePoint[];
  budgets: BudgetRow[];
  currencies: string[];
  month: string;
  onViewChange: (view: string) => void;
  previous?: Summary;
  summary: Summary;
  today: string;
  view: string;
};

function HomeSpending({
  currency,
  figures,
  format,
  month,
  previous,
  summary,
}: {
  currency: string;
  figures: BudgetFigures[];
  format: (value: number) => string;
  month: string;
  previous?: Summary;
  summary: Summary;
}) {
  return (
    <div className="home__row">
      <Panel
        title="Where your money went"
        description={`Spending by group · ${monthLabel(month)} · ${currency}`}
      >
        <SpendingBars
          comparison={
            hasSpendingIn(previous?.breakdown ?? [], currency)
              ? monthLabel(shiftMonth(month, -1)).split(' ')[0]
              : undefined
          }
          format={format}
          month={month}
          slices={groupSpendingSlices(summary.breakdown, previous?.breakdown ?? [], currency)}
        />
      </Panel>
      {figures.length > 0 && <BudgetsToWatch figures={figures} format={format} />}
    </div>
  );
}

function HomeCashFlow({ currency, summary }: { currency: string; summary: Summary }) {
  return (
    <CashFlowChart
      description={`Last ${CashFlowMonths} months · ${currency}`}
      format={value => formatMoney(value, currency)}
      formatTick={value => formatCompactMoney(value, currency)}
      data={cashFlowPoints(summary, currency)}
    />
  );
}

function HomeNetWorth({
  balances,
  currency,
  month,
  summary,
}: {
  balances: BalancePoint[];
  currency: string;
  month: string;
  summary: Summary;
}) {
  if (month === currentMonth()) {
    return (
      <NetWorthCard
        balances={balances}
        buckets={summary.netWorth}
        converted={summary.converted}
        currency={currency}
        summary={summary}
      />
    );
  }

  return (
    <NetWorthCard
      balances={balances}
      buckets={netWorthAt(balances, summary.accounts, month)}
      currency={currency}
      heading={`Net worth at the end of ${monthLabel(month)}`}
      summary={summary}
    />
  );
}

function HomeContent({
  balances,
  budgets,
  currencies,
  month,
  onViewChange,
  previous,
  summary,
  today,
  view,
}: HomeContentProps) {
  const converted = view === ConvertedView ? summary.converted : null;
  const currency = converted?.currency ?? view;
  const format = (value: number) => formatMoney(value, currency);

  const figures = budgets
    .filter(row => row.currency === currency)
    .map(row => budgetFigures(row, today));

  return (
    <>
      <div className="home__row">
        {converted ? (
          <ConvertedOverview
            converted={converted}
            currencies={currencies}
            onViewChange={onViewChange}
          />
        ) : (
          <HomeHero
            figures={figures}
            format={format}
            month={month}
            previousMonth={shiftMonth(month, -1)}
            today={today}
            totals={heroTotals(summary, previous, currency)}
          />
        )}
        <HomeNetWorth balances={balances} currency={currency} month={month} summary={summary} />
      </div>
      <AttentionStrip items={attentionItems(summary.needsReviewCount, figures, format)} />
      {!converted && month === currentMonth() && <LeftToSpend currency={currency} month={month} />}
      {!converted && (
        <HomeSpending
          currency={currency}
          figures={figures}
          format={format}
          month={month}
          previous={previous}
          summary={summary}
        />
      )}
      <div className="home__row">
        <RecentActivity currency={converted ? undefined : currency} month={month} />
        {!converted && <HomeCashFlow currency={currency} summary={summary} />}
      </div>
    </>
  );
}
