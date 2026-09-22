'use client';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Button } from '../primitives/button';
import { formatMoney } from '@/lib/money';
import { AccountSummary } from './use-finance-data';
import type { NetWorthBucket } from '@/server/reports/service';
import s from './finance.module.scss';

/** One net-worth card per currency: assets, liabilities and net. Currencies are never summed. */
export function NetWorthCards({
  buckets,
  accounts,
}: {
  buckets: NetWorthBucket[];
  accounts: AccountSummary[];
}) {
  if (!buckets.length)
    return (
      <section className={s.balance}>
        <div className={s.balanceTitle}>
          <h2>Net worth</h2>
        </div>
        <p className={s.muted}>Add an account to see your net worth.</p>
        <div className={s.actions}>
          <Button asChild variant="secondary">
            <Link href="/accounts">
              Accounts
              <ArrowUpRight />
            </Link>
          </Button>
        </div>
      </section>
    );
  return (
    <>
      {buckets.map(bucket => {
        const count = accounts.filter(a => a.currency === bucket.currency).length;
        return (
          <section className={s.balance} key={bucket.currency}>
            <div className={s.balanceTitle}>
              <h2>Net worth</h2>
              <span>{bucket.currency}</span>
            </div>
            <div>
              <p className={s.muted}>
                {count} account{count === 1 ? '' : 's'} in {bucket.currency}
              </p>
              <div className={s.metricValue}>{formatMoney(bucket.netMinor, bucket.currency)}</div>
            </div>
            <div className={s.balanceTitle}>
              <span className={s.muted}>
                Assets {formatMoney(bucket.assetsMinor, bucket.currency)}
              </span>
              <span className={s.muted}>
                Owed {formatMoney(-bucket.liabilitiesMinor, bucket.currency)}
              </span>
            </div>
            <div className={s.actions}>
              <Button asChild variant="secondary">
                <Link href="/accounts">
                  View accounts
                  <ArrowUpRight />
                </Link>
              </Button>
            </div>
          </section>
        );
      })}
    </>
  );
}
