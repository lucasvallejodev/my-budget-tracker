'use client';

import { Columns } from '@/components/ui';
import { transactionsHref } from '@/lib/navigation';
import { formatMoney } from '@coinkeeper/shared/lib/money';
import type { RankingSlice } from '@coinkeeper/shared/schema/reports';

import { type RankingItem, SpendingRanking } from '../spending-ranking';
import { useSpendingRanking } from '../use-finance-data';

const TopItems = 8;

const rankingItems = (slices: RankingSlice[], currency: string, month: string): RankingItem[] =>
  slices
    .filter(slice => slice.currency === currency)
    .slice(0, TopItems)
    .map(slice => ({
      href: transactionsHref(slice.name, month),
      name: slice.name,
      spentMinor: slice.spentMinor,
      transactions: slice.transactions,
    }));

export function AnalyticsRankings({ currencies, month }: { currencies: string[]; month: string }) {
  const payees = useSpendingRanking(month, 'payee');
  const accounts = useSpendingRanking(month, 'account');

  return currencies.map(currency => {
    const format = (value: number) => formatMoney(value, currency);

    return (
      <Columns key={currency}>
        <SpendingRanking
          title={`Top payees · ${currency}`}
          format={format}
          items={rankingItems(payees.data ?? [], currency, month)}
        />
        <SpendingRanking
          title={`Spending by account · ${currency}`}
          format={format}
          items={rankingItems(accounts.data ?? [], currency, month)}
        />
      </Columns>
    );
  });
}
