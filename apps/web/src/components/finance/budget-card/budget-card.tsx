import './budget-card.scss';

import Link from 'next/link';

import { Badge, Button, Cluster, Icon, IconTile, Text } from '@/components/ui';
import { transactionsHref } from '@/lib/navigation';
import { ISO_MONTH_LENGTH } from '@coinkeeper/shared/constants/time';
import { budgetPace } from '@coinkeeper/shared/lib/budget-pace';
import { calendarPeriod } from '@coinkeeper/shared/lib/periods';

import { BudgetProgress } from '../budget-progress';
import type { BudgetRow } from '../use-finance-data';
import { budgetStatus } from './budget-status';

export function BudgetCard({
  budget,
  format,
  onDelete,
  onEdit,
  today,
}: {
  budget: BudgetRow;
  format: (value: number) => string;
  onDelete: () => void;
  onEdit: () => void;
  today: string;
}) {
  const month = budget.month.slice(0, ISO_MONTH_LENGTH);
  const ratio = budget.amountMinor > 0 ? budget.spentMinor / budget.amountMinor : 0;

  const pace = budgetPace({
    limitMinor: budget.amountMinor,
    period: calendarPeriod(month),
    spentMinor: budget.spentMinor,
    today,
  });

  const status = budgetStatus(ratio, pace.tooFast);

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
        pace={pace}
        label={`${budget.categoryName} budget`}
        format={format}
      />
      <Cluster className="budget-card__actions">
        <Button variant="outline" size="sm" onClick={onEdit}>
          Edit
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={transactionsHref(budget.categoryName, month)}>View transactions</Link>
        </Button>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          Delete
        </Button>
      </Cluster>
    </article>
  );
}
