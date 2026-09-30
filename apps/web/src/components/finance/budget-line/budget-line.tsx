'use client';

import './budget-line.scss';

import { Ellipsis } from 'lucide-react';
import Link from 'next/link';

import {
  Avatar,
  Button,
  Icon,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  ProgressBar,
} from '@/components/ui';
import { getPercentage } from '@/lib/math';
import { transactionsHref } from '@/lib/navigation';
import { cn } from '@/lib/styles';
import { ISO_MONTH_LENGTH } from '@coinkeeper/shared/constants/time';

import { type BudgetFigures, BudgetStates } from '../budget-status';

type Format = (value: number) => string;

export const leftLabel = ({ leftMinor }: BudgetFigures, format: Format): string =>
  leftMinor < 0 ? `${format(-leftMinor)} over` : `${format(leftMinor)} left`;

export const allowanceLabel = ({ leftMinor, pace }: BudgetFigures, format: Format): string => {
  if (!pace.isCurrent) return '';
  if (leftMinor <= 0) return 'Nothing left this month';

  return `${format(pace.perDayLeftMinor)} a day`;
};

export function BudgetLine({
  compact = false,
  figures,
  format,
  onDelete,
  onEdit,
}: {
  compact?: boolean;
  figures: BudgetFigures;
  format: Format;
  onDelete?: () => void;
  onEdit?: () => void;
}) {
  const { budget, pace, state } = figures;
  const month = budget.month.slice(0, ISO_MONTH_LENGTH);
  const href = transactionsHref(budget.categoryName, month);
  const percent = getPercentage(budget.spentMinor, budget.amountMinor);

  return (
    <li className={cn('budget-line', { 'budget-line--compact': compact })}>
      <Avatar color={budget.color} size={compact ? 'small' : 'default'}>
        <Icon icon={budget.icon} />
      </Avatar>
      <div className="budget-line__name">
        <Link className="budget-line__title" href={href}>
          {budget.categoryName}
        </Link>
        {!compact && <span className="budget-line__meta">{budget.groupName}</span>}
      </div>
      <div className="budget-line__progress">
        <ProgressBar
          label={`${budget.categoryName}: ${percent}% of the budget spent`}
          max={budget.amountMinor || 1}
          value={Math.min(budget.spentMinor, budget.amountMinor)}
          marker={pace.isCurrent ? pace.expectedMinor : undefined}
          tone={BudgetStates[state].progress}
        />
        <span className="budget-line__meta">
          {format(budget.spentMinor)} of {format(budget.amountMinor)} · {percent}%
        </span>
      </div>
      <div className="budget-line__left">
        <span
          className={cn('budget-line__amount', { 'budget-line__amount--over': state === 'over' })}
        >
          {leftLabel(figures, format)}
        </span>
        <span className="budget-line__meta">{allowanceLabel(figures, format)}</span>
      </div>
      {onEdit && onDelete && (
        <Menu>
          <MenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="budget-line__menu"
              aria-label={`Actions for the ${budget.categoryName} budget`}
            >
              <Ellipsis />
            </Button>
          </MenuTrigger>
          <MenuContent align="end">
            <MenuItem onSelect={onEdit}>Edit budget</MenuItem>
            <MenuItem asChild>
              <Link href={href}>View transactions</Link>
            </MenuItem>
            <MenuItem onSelect={onDelete}>Delete budget</MenuItem>
          </MenuContent>
        </Menu>
      )}
    </li>
  );
}
