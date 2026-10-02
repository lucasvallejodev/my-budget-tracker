import './split-categories.scss';

import { Split } from 'lucide-react';

import { Avatar, Icon } from '@/components/ui';
import { formatMoney } from '@coinkeeper/shared/lib/money';

import { splitLabel } from '../transaction-labels';
import { TransactionRow } from '../use-finance-data';

export function SplitCategories({ transaction }: { transaction: TransactionRow }) {
  return (
    <div className="split-categories">
      <span className="split-categories__label">
        <Split aria-hidden className="split-categories__icon" />
        {splitLabel(transaction)}
      </span>
      <ul className="split-categories__lines">
        {transaction.splits.map(line => (
          <li key={line.id} className="split-categories__line">
            <Avatar color={line.groupColor} size="small">
              <Icon icon={line.categoryIcon} />
            </Avatar>
            <span className="split-categories__name">{line.categoryName ?? 'Uncategorized'}</span>
            <span className="split-categories__amount">
              {formatMoney(Math.abs(line.amountMinor), transaction.currency)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
