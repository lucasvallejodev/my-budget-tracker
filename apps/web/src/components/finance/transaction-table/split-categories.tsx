import './split-categories.scss';

import { ChevronDown, Split } from 'lucide-react';

import { Avatar, Icon } from '@/components/ui';
import { formatMoney } from '@coinkeeper/shared/lib/money';

import { splitLabel } from '../transaction-labels';
import { TransactionRow } from '../use-finance-data';

export function SplitToggle({
  controls,
  expanded,
  onToggle,
  transaction,
}: {
  controls: string;
  expanded: boolean;
  onToggle: () => void;
  transaction: TransactionRow;
}) {
  return (
    <button
      type="button"
      className="split-categories__toggle"
      aria-expanded={expanded}
      aria-controls={controls}
      onClick={onToggle}
    >
      <Avatar size="small">
        <Split />
      </Avatar>
      {splitLabel(transaction)}
      <ChevronDown className="split-categories__chevron" aria-hidden />
    </button>
  );
}

export function SplitLines({
  hidden,
  id,
  transaction,
}: {
  hidden: boolean;
  id: string;
  transaction: TransactionRow;
}) {
  return (
    <ul
      id={id}
      hidden={hidden}
      className="split-categories"
      aria-label={`${splitLabel(transaction)} categories`}
    >
      {transaction.splits.map(line => (
        <li key={line.id} className="split-categories__line">
          <Avatar color={line.groupColor} size="small">
            <Icon icon={line.categoryIcon} />
          </Avatar>
          <span className="split-categories__name">{line.categoryName ?? 'Uncategorized'}</span>
          <span className="split-categories__amount">
            {formatMoney(line.amountMinor, transaction.currency, { signDisplay: 'exceptZero' })}
          </span>
        </li>
      ))}
    </ul>
  );
}
