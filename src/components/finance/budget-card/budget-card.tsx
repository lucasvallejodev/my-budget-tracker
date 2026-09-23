import './budget-card.scss';

import Link from 'next/link';

import { Badge, Button, Cluster, Icon, IconTile, Text } from '@/components/ui';

import { BudgetProgress } from '../budget-progress';
import type { BudgetRow } from '../use-finance-data';
import { budgetStatus } from './budget-status';

export function BudgetCard({
  budget,
  format,
  onDelete,
  onEdit,
}: {
  budget: BudgetRow;
  format: (value: number) => string;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const ratio = budget.amountMinor > 0 ? budget.spentMinor / budget.amountMinor : 0;
  const status = budgetStatus(ratio);

  return (
    <article className="budget-card">
      <Cluster justify="between">
        <Cluster>
          <IconTile color={budget.color}>
            <Icon icon={budget.icon} />
          </IconTile>
          <div>
            <h3>{budget.categoryName}</h3>
            <Text tone="muted">
              {budget.groupName} · Budget {format(budget.amountMinor)} · Spent{' '}
              {format(budget.spentMinor)}
            </Text>
          </div>
        </Cluster>
        <Badge tone={status.tone}>{status.label}</Badge>
      </Cluster>
      <BudgetProgress
        spent={budget.spentMinor}
        limit={budget.amountMinor}
        label={`${budget.categoryName} budget`}
        format={format}
      />
      <Cluster className="budget-card__actions">
        <Button variant="outline" size="sm" onClick={onEdit}>
          Edit
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/transactions?q=${encodeURIComponent(budget.categoryName)}`}>
            View transactions
          </Link>
        </Button>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          Delete
        </Button>
      </Cluster>
    </article>
  );
}
