'use client';

import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

import { formatMoney } from '@/lib/money';
import type { NetWorthBucket } from '@/server/reports/service';

import { Button } from '../primitives/button';
import styles from './finance.module.scss';
import { AccountSummary } from './use-finance-data';

export function NetWorthCards({
  accounts,
  buckets,
}: {
  accounts: AccountSummary[];
  buckets: NetWorthBucket[];
}) {
  if (!buckets.length) {
    return (
      <section className={styles.balance}>
        <div className={styles.balanceTitle}>
          <h2>Net worth</h2>
        </div>
        <p className={styles.muted}>Add an account to see your net worth.</p>
        <div className={styles.actions}>
          <Button asChild variant="secondary">
            <Link href="/accounts">
              Accounts
              <ArrowUpRight />
            </Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <>
      {buckets.map(bucket => {
        const count = accounts.filter(account => account.currency === bucket.currency).length;

        return (
          <section className={styles.balance} key={bucket.currency}>
            <div className={styles.balanceTitle}>
              <h2>Net worth</h2>
              <span>{bucket.currency}</span>
            </div>
            <div>
              <p className={styles.muted}>
                {count} account{count === 1 ? '' : 's'} in {bucket.currency}
              </p>
              <div className={styles.metricValue}>
                {formatMoney(bucket.netMinor, bucket.currency)}
              </div>
            </div>
            <div className={styles.balanceTitle}>
              <span className={styles.muted}>
                Assets {formatMoney(bucket.assetsMinor, bucket.currency)}
              </span>
              <span className={styles.muted}>
                Owed {formatMoney(-bucket.liabilitiesMinor, bucket.currency)}
              </span>
            </div>
            <div className={styles.actions}>
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
