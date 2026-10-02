'use client';

import './budget-line.scss';

import { Ellipsis } from 'lucide-react';
import Link from 'next/link';

import {
  Avatar,
  Badge,
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

import { type BudgetFigures, type BudgetState, BudgetStates } from '../budget-status';

type Format = (value: number) => string;

export const leftLabel = ({ leftMinor }: BudgetFigures, format: Format): string =>
  leftMinor < 0 ? `${format(-leftMinor)} over` : `${format(leftMinor)} left`;

const billsNote = ({ budget }: BudgetFigures, format: Format): string =>
  budget.billsDueMinor > 0 ? ` · ${format(budget.billsDueMinor)} in bills to come` : '';

export const allowanceLabel = (figures: BudgetFigures, format: Format): string => {
  const { leftMinor, pace } = figures;

  if (!pace.isCurrent) return '';
  if (leftMinor <= 0) return 'Nothing left this month';

  return `${format(pace.perDayLeftMinor)} a day${billsNote(figures, format)}`;
};

const rowNote = (figures: BudgetFigures, format: Format, compact: boolean) =>
  compact && figures.state !== 'ok'
    ? BudgetStates[figures.state].label
    : allowanceLabel(figures, format);

function StatusBadge({ state }: { state: BudgetState }) {
  if (state === 'ok') return null;

  const { icon: StatusIcon, label, tone } = BudgetStates[state];

  return (
    <span className="budget-line__status">
      <Badge tone={tone} icon={<StatusIcon aria-hidden />}>
        {label}
      </Badge>
    </span>
  );
}

function BudgetLineMenu({
  categoryName,
  href,
  onDelete,
  onEdit,
}: {
  categoryName: string;
  href: string;
  onDelete: () => void;
  onEdit: () => void;
}) {
  return (
    <Menu>
      <MenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="budget-line__menu"
          aria-label={`Actions for the ${categoryName} budget`}
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
  );
}

export function BudgetLine({
  compact = false,
  figures,
  format,
  onDelete,
  onEdit,
  showStatus = true,
}: {
  compact?: boolean;
  figures: BudgetFigures;
  format: Format;
  onDelete?: () => void;
  onEdit?: () => void;
  showStatus?: boolean;
}) {
  const { budget, pace, state } = figures;
  const month = budget.month.slice(0, ISO_MONTH_LENGTH);
  const href = transactionsHref(budget.categoryName, month);
  const percent = getPercentage(budget.spentMinor, budget.amountMinor);
  const status = BudgetStates[state];

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
        {showStatus && <StatusBadge state={state} />}
      </div>
      <div className="budget-line__progress">
        <ProgressBar
          label={`${budget.categoryName}: ${percent}% of the budget spent, ${status.label.toLowerCase()}`}
          max={budget.amountMinor || 1}
          value={Math.min(budget.spentMinor, budget.amountMinor)}
          marker={pace.isCurrent ? pace.expectedMinor : undefined}
          tone={status.progress}
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
        <span className="budget-line__meta">{rowNote(figures, format, compact)}</span>
      </div>
      {onEdit && onDelete && (
        <BudgetLineMenu
          categoryName={budget.categoryName}
          href={href}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      )}
    </li>
  );
}
