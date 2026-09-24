'use client';

import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui';
import { formatMoney } from '@/lib/money';
import type { NetWorthBucket } from '@/schema/reports';

import { BalanceCard } from '../balance-card';
import { AccountSummary } from '../use-finance-data';

function AccountsLink({ label }: { label: string }) {
  return (
    <Button asChild variant="secondary">
      <Link href="/accounts">
        {label}
        <ArrowUpRight />
      </Link>
    </Button>
  );
}

export function NetWorthCards({
  accounts,
  buckets,
}: {
  accounts: AccountSummary[];
  buckets: NetWorthBucket[];
}) {
  if (!buckets.length) {
    return (
      <BalanceCard
        title="Net worth"
        caption="Add an account to see your net worth."
        actions={<AccountsLink label="Accounts" />}
      />
    );
  }

  return (
    <>
      {buckets.map(bucket => {
        const count = accounts.filter(account => account.currency === bucket.currency).length;

        return (
          <BalanceCard
            key={bucket.currency}
            title="Net worth"
            label={bucket.currency}
            caption={`${count} account${count === 1 ? '' : 's'} in ${bucket.currency}`}
            value={formatMoney(bucket.netMinor, bucket.currency)}
            details={
              <>
                <span>Assets {formatMoney(bucket.assetsMinor, bucket.currency)}</span>
                <span>Owed {formatMoney(-bucket.liabilitiesMinor, bucket.currency)}</span>
              </>
            }
            actions={<AccountsLink label="View accounts" />}
          />
        );
      })}
    </>
  );
}
