import './net-worth-card.scss';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { Button, Sparkline, Stat } from '@/components/ui';
import { formatMoney } from '@coinkeeper/shared/lib/money';

import { describeConversion } from '../conversion';
import { netWorthByMonth } from '../net-worth';
import type { AccountSummary, BalancePoint, Summary } from '../use-finance-data';

const PreviousPointOffset = 2;

function CurrencyNetWorth({
  accounts,
  balances,
  bucket,
  lead,
}: {
  accounts: AccountSummary[];
  balances: BalancePoint[];
  bucket: Summary['netWorth'][number];
  lead: boolean;
}) {
  const series = netWorthByMonth(balances, bucket.currency).map(point => point.totalMinor);
  const format = (value: number) => formatMoney(value, bucket.currency);
  const count = accounts.filter(account => account.currency === bucket.currency).length;
  const previous = series.length > 1 ? series[series.length - PreviousPointOffset] : undefined;
  const change = previous === undefined ? 0 : bucket.netMinor - previous;

  return (
    <div className="net-worth-card__row">
      <Stat
        label={`${bucket.currency} · ${count} account${count === 1 ? '' : 's'}`}
        size={lead ? 'large' : 'default'}
        value={format(bucket.netMinor)}
        delta={
          change
            ? {
                good: change > 0,
                label: format(Math.abs(change)),
                rising: change > 0,
              }
            : undefined
        }
        meta={previous === undefined ? undefined : 'since last month'}
      />
      <Sparkline
        label={`${bucket.currency} net worth over the last ${series.length} months`}
        points={series}
        color={change < 0 ? 'var(--color-negative-mark)' : 'var(--color-positive-mark)'}
      />
    </div>
  );
}

export function NetWorthCard({
  balances,
  currency,
  summary,
}: {
  balances: BalancePoint[];
  currency: string;
  summary: Summary;
}) {
  const buckets = [...summary.netWorth].sort(
    (left, right) => Number(right.currency === currency) - Number(left.currency === currency)
  );

  const lead = buckets[0];

  return (
    <section className="net-worth-card" aria-label="Net worth">
      <div className="net-worth-card__head">
        <p className="net-worth-card__eyebrow">Net worth</p>
        <Button asChild variant="ghost" size="sm">
          <Link href="/accounts">
            Accounts <ArrowRight aria-hidden />
          </Link>
        </Button>
      </div>
      {buckets.map(bucket => (
        <CurrencyNetWorth
          key={bucket.currency}
          accounts={summary.accounts}
          balances={balances}
          bucket={bucket}
          lead={bucket === lead}
        />
      ))}
      {lead && (
        <p className="net-worth-card__legend">
          <span>
            Assets <strong>{formatMoney(lead.assetsMinor, lead.currency)}</strong>
          </span>
          <span>
            Owed <strong>{formatMoney(-lead.liabilitiesMinor, lead.currency)}</strong>
          </span>
          {summary.converted && (
            <span title={describeConversion(summary.converted)}>
              ≈ {formatMoney(summary.converted.netWorthMinor, summary.converted.currency)} all in{' '}
              {summary.converted.currency}
            </span>
          )}
        </p>
      )}
    </section>
  );
}
