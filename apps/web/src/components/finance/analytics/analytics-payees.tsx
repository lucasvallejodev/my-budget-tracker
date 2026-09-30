'use client';

import './analytics-payees.scss';

import Link from 'next/link';

import {
  Avatar,
  Panel,
  QueryContent,
  Table,
  TableCell,
  TableHeaderCell,
  TableRow,
  Text,
} from '@/components/ui';
import { accountTypeStyle } from '@/constants/account';
import { getPercentage } from '@/lib/math';
import { transactionsHref } from '@/lib/navigation';

import { PayeeAvatar } from '../payee-avatar';
import { type AccountSummary, useAccounts, useBreakdown } from '../use-finance-data';
import type { AnalyticsContext } from './analytics-context';
import { periodLabel } from './analytics-data';

const TopPayees = 15;

function AccountIcon({ account }: { account?: AccountSummary }) {
  const { color, icon: TypeIcon } = accountTypeStyle(account?.type ?? 'other');

  return (
    <Avatar color={color} shape="square" size="small">
      <TypeIcon />
    </Avatar>
  );
}

function TopPayeesTable({ context }: { context: AnalyticsContext }) {
  const { currency, filters, format } = context;

  const payees = useBreakdown('payee', {
    currency,
    month: filters.month,
    months: filters.range,
  });

  const rows = (payees.data ?? []).filter(row => row.currency === currency).slice(0, TopPayees);
  const total = rows.reduce((sum, row) => sum + row.spentMinor, 0);

  return (
    <Panel title="Top payees" description={periodLabel(filters.month, filters.range)}>
      <QueryContent pending={payees.isPending} loading="Loading…">
        {() => (
          <Table label="Top payees">
            <thead>
              <tr>
                <TableHeaderCell>Payee</TableHeaderCell>
                <TableHeaderCell>Transactions</TableHeaderCell>
                <TableHeaderCell>Average</TableHeaderCell>
                <TableHeaderCell>Total</TableHeaderCell>
                <TableHeaderCell>Share</TableHeaderCell>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <TableRow key={row.id ?? row.name}>
                  <TableCell>
                    <span className="analytics-payees__name">
                      <PayeeAvatar name={row.name} size="small" />
                      <Link href={transactionsHref(row.name, filters.month)}>{row.name}</Link>
                    </span>
                  </TableCell>
                  <TableCell>{row.transactions}</TableCell>
                  <TableCell>
                    {format(Math.round(row.spentMinor / Math.max(1, row.transactions)))}
                  </TableCell>
                  <TableCell>{format(row.spentMinor)}</TableCell>
                  <TableCell>{getPercentage(row.spentMinor, total)}%</TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        )}
      </QueryContent>
    </Panel>
  );
}

function AccountSpending({ context }: { context: AnalyticsContext }) {
  const { currency, filters, format } = context;

  const spending = useBreakdown('account', {
    currency,
    month: filters.month,
    months: filters.range,
  });

  const accounts = useAccounts(true);
  const rows = (spending.data ?? []).filter(row => row.currency === currency);

  return (
    <Panel title="Spending by account" description="Which card or account paid">
      <ul className="analytics-payees__accounts">
        {rows.map(row => (
          <li key={row.id ?? row.name} className="analytics-payees__account">
            <AccountIcon account={accounts.data?.find(account => account.id === row.id)} />
            <span className="analytics-payees__account-name">{row.name}</span>
            <span className="analytics-payees__amount">{format(row.spentMinor)}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function AnalyticsPayees({ context }: { context: AnalyticsContext }) {
  return (
    <div className="analytics-payees">
      <TopPayeesTable context={context} />
      <div className="analytics-payees__side">
        <AccountSpending context={context} />
        <Panel title="About payee logos">
          <Text tone="muted" size="small">
            Known brands show their logo, bundled with CoinKeeper, so no payee name ever leaves your
            server. Everyone else gets their initials on a colour picked from the name.
          </Text>
        </Panel>
      </div>
    </div>
  );
}
