'use client';
import { ArrowDownRight, ArrowUpRight, Plus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useFinanceData } from './use-finance-data';
import {
  Panel,
  PageHeading,
  MetricCard,
  BalanceCard,
  EmptyState,
  money,
  LinkedAccount,
} from './blocks';
import { CashFlowChart, DistributionChart } from './charts';
import { Button } from '../primitives/button';
import { TransactionTable } from '../transaction-table';
import CreateTransactionDialog from '@/app/(main)/_components/create-transaction-dialog';
import CreateAccountDialog from '@/app/(main)/_components/create-account-dialog';
import { categoryName } from './transaction-explorer';
import s from './finance.module.scss';
export function Overview({ analytics = false }: { analytics?: boolean }) {
  const { transactions, accounts } = useFinanceData();
  const [period, setPeriod] = useState('Monthly');
  if (transactions.isPending || accounts.isPending)
    return (
      <div className={s.page} role="status">
        Loading your finances…
      </div>
    );
  if (transactions.isError || accounts.isError)
    return (
      <div className={s.page}>
        <EmptyState
          title="Could not load your finances"
          action={
            <Button
              onClick={() => {
                void transactions.refetch();
                void accounts.refetch();
              }}
            >
              Try again
            </Button>
          }
        />
      </div>
    );
  const rows = transactions.data || [];
  const now = new Date();
  const monthRows = rows.filter(t => {
    const d = new Date(t.date);
    return d.getUTCFullYear() === now.getUTCFullYear() && d.getUTCMonth() === now.getUTCMonth();
  });
  const income = monthRows
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const expense = monthRows
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const points = Array.from(
    { length: period === 'Yearly' ? 5 : period === 'Weekly' ? 7 : 8 },
    (_, i) => {
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      if (period === 'Yearly') date.setUTCFullYear(now.getUTCFullYear() - 4 + i);
      else if (period === 'Weekly') date.setUTCDate(now.getUTCDate() - 6 + i);
      else {
        date.setUTCDate(1);
        date.setUTCMonth(now.getUTCMonth() - 7 + i);
      }
      const match = rows.filter(t => {
        const d = new Date(t.date);
        return (
          d.getUTCFullYear() === date.getUTCFullYear() &&
          (period === 'Yearly' || d.getUTCMonth() === date.getUTCMonth()) &&
          (period !== 'Weekly' || d.getUTCDate() === date.getUTCDate())
        );
      });
      return {
        label: date.toLocaleDateString(
          'en-US',
          period === 'Yearly'
            ? { year: 'numeric', timeZone: 'UTC' }
            : period === 'Weekly'
              ? { weekday: 'short', timeZone: 'UTC' }
              : { month: 'short', timeZone: 'UTC' }
        ),
        income: match.filter(t => t.type === 'INCOME').reduce((n, t) => n + Number(t.amount), 0),
        expense: match.filter(t => t.type === 'EXPENSE').reduce((n, t) => n + Number(t.amount), 0),
      };
    }
  );
  const totals = monthRows
    .filter(t => t.type === 'EXPENSE')
    .reduce<Record<string, number>>((result, t) => {
      const key = categoryName(t);
      result[key] = (result[key] || 0) + Number(t.amount);
      return result;
    }, {});
  return (
    <div className={s.page}>
      <PageHeading
        title={analytics ? 'Analytics' : 'Dashboard Overview'}
        description={
          analytics
            ? 'Understand your spending patterns and financial performance over time.'
            : 'Track your money, performance, and trends — all in one place.'
        }
        actions={
          <CreateTransactionDialog
            trigger={
              <Button>
                <Plus />
                New transaction
              </Button>
            }
          />
        }
      />
      <div className={s.grid}>
        <MetricCard
          label="Monthly Income"
          value={money(income)}
          icon={<ArrowUpRight />}
          detail="This calendar month"
        />
        <MetricCard
          label="Monthly Expense"
          value={money(expense)}
          icon={<ArrowDownRight />}
          detail="This calendar month"
        />
        {analytics && (
          <MetricCard
            label="Savings Rate"
            value={income ? `${Math.round(((income - expense) / income) * 100)}%` : '—'}
            detail="This calendar month"
          />
        )}
      </div>
      <div className={s.columns}>
        <div className={s.stack}>
          <CashFlowChart
            data={points}
            action={
              <select
                className={s.filter}
                aria-label="Cash flow period"
                value={period}
                onChange={e => setPeriod(e.target.value)}
              >
                {['Monthly', 'Weekly', 'Yearly'].map(p => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            }
          />
          <Panel
            title="Recent Transactions"
            action={
              <Button asChild variant="ghost" size="sm">
                <Link href="/transactions">See more</Link>
              </Button>
            }
          >
            <TransactionTable transactions={rows.slice(0, 5)} />
          </Panel>
        </div>
        <div className={s.stack}>
          <BalanceCard
            amount={(accounts.data || []).reduce((sum, a) => sum + Number(a.balance), 0)}
            actions={
              <Button asChild variant="secondary">
                <Link href="/accounts">
                  View accounts
                  <ArrowUpRight />
                </Link>
              </Button>
            }
          />
          <DistributionChart
            data={Object.entries(totals).map(([name, value]) => ({ name, value }))}
          />
        </div>
      </div>
    </div>
  );
}
export function AccountsOverview() {
  const { accounts } = useFinanceData();
  return (
    <div className={s.page}>
      <PageHeading
        title="Accounts"
        description="Your accounts and current balances."
        actions={<CreateAccountDialog />}
      />
      <Panel title="Your accounts">
        {accounts.isPending ? (
          <p role="status">Loading accounts…</p>
        ) : accounts.isError ? (
          <EmptyState
            title="Could not load accounts"
            action={<Button onClick={() => void accounts.refetch()}>Try again</Button>}
          />
        ) : accounts.data?.length ? (
          accounts.data.map(a => (
            <LinkedAccount
              key={a.id}
              name={a.name}
              detail={`${a.institution || a.type} · ${money(Number(a.balance))}`}
              actions={
                <Button asChild variant="outline" size="sm">
                  <Link href={`/accounts/${a.id}`}>View</Link>
                </Button>
              }
            />
          ))
        ) : (
          <EmptyState
            title="No accounts yet"
            description="Create an account to start recording transactions."
          />
        )}
      </Panel>
    </div>
  );
}
