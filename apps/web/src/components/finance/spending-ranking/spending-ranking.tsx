import './spending-ranking.scss';

import Link from 'next/link';

import { EmptyState, Panel, ProgressBar } from '@/components/ui';

export type RankingItem = {
  href: string;
  name: string;
  spentMinor: number;
  transactions: number;
};

export function SpendingRanking({
  format,
  items,
  title,
}: {
  format: (value: number) => string;
  items: RankingItem[];
  title: string;
}) {
  const largest = items[0]?.spentMinor ?? 0;

  return (
    <Panel title={title}>
      {items.length ? (
        <ol className="spending-ranking">
          {items.map(item => (
            <li key={item.href} className="spending-ranking__row">
              <div className="spending-ranking__header">
                <Link className="spending-ranking__name" href={item.href}>
                  {item.name}
                </Link>
                <strong className="spending-ranking__amount">{format(item.spentMinor)}</strong>
              </div>
              <ProgressBar label={`${item.name} spending`} max={largest} value={item.spentMinor} />
              <span className="spending-ranking__count">
                {item.transactions} transaction{item.transactions === 1 ? '' : 's'}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <EmptyState title="No spending this month" />
      )}
    </Panel>
  );
}
