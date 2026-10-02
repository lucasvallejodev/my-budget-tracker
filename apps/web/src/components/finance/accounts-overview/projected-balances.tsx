'use client';

import Link from 'next/link';

import { Badge, ListRow, Panel, QueryContent, Text } from '@/components/ui';
import { formatMoney } from '@coinkeeper/shared/lib/money';
import { DEFAULT_PROJECTION_DAYS } from '@coinkeeper/shared/schema/accounts';

import { dayMonthLabel } from '../transaction-labels';
import { type AccountProjection, type AccountSummary, useProjections } from '../use-finance-data';
import { displayedBalance, isLiability } from './accounts-figures';

const goesNegative = (account: AccountSummary, projection: AccountProjection): boolean =>
  !isLiability(account) && projection.lowestMinor < 0 && !!projection.lowestOn;

const describeProjection = (account: AccountSummary, projection: AccountProjection): string => {
  const now = formatMoney(displayedBalance(account, projection.balanceMinor), projection.currency);

  const then = formatMoney(
    displayedBalance(account, projection.projectedMinor),
    projection.currency
  );

  const payments =
    projection.scheduledCount === 1 ? '1 payment' : `${projection.scheduledCount} payments`;

  return `${now} now → ${then} by ${dayMonthLabel(projection.until)} · ${payments}`;
};

export function ProjectedBalances({ accounts }: { accounts: AccountSummary[] }) {
  const projections = useProjections(DEFAULT_PROJECTION_DAYS);
  const byId = new Map(accounts.map(account => [account.id, account]));

  const rows = (projections.data ?? []).flatMap(projection => {
    const account = byId.get(projection.accountId);

    return account && projection.scheduledCount > 0 ? [{ account, projection }] : [];
  });

  return (
    <Panel
      title="Next 30 days"
      description="Balances after the recurring payments still due on each account."
    >
      <QueryContent
        pending={projections.isPending}
        error={projections.isError}
        loading="Projecting balances…"
        empty={
          !rows.length && (
            <Text tone="muted">
              Nothing scheduled. Add bills and income on <Link href="/upcoming">Upcoming</Link> to
              see where each account is heading.
            </Text>
          )
        }
      >
        {() =>
          rows.map(({ account, projection }) => (
            <ListRow
              key={account.id}
              title={account.name}
              description={describeProjection(account, projection)}
            >
              {goesNegative(account, projection) && (
                <Badge tone="danger">Below zero on {dayMonthLabel(projection.lowestOn!)}</Badge>
              )}
            </ListRow>
          ))
        }
      </QueryContent>
    </Panel>
  );
}
