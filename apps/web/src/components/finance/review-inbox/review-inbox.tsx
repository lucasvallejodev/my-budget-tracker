'use client';

import './review-inbox.scss';

import { useMutation } from '@tanstack/react-query';
import { Check, Sparkles, Undo2 } from 'lucide-react';
import { KeyboardEvent, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { categorizeTransaction, reopenReview } from '@/api/mutations';
import {
  Amount,
  Avatar,
  Badge,
  Button,
  EmptyState,
  Icon,
  Page,
  PageHeading,
  Panel,
  QueryContent,
} from '@/components/ui';
import { useHydrated } from '@/lib/hydration';
import { localIsoDate } from '@coinkeeper/shared/lib/date-helpers';

import { CategoryPicker, type FlatCategory, flattenCategories } from '../category-picker';
import { PayeeAvatar } from '../payee-avatar';
import { dayLabel, describeTransaction } from '../transaction-labels';
import {
  type ReviewSuggestion,
  TransactionRow,
  useCategories,
  useRefreshFinance,
  useReviewSuggestions,
  useTransactions,
} from '../use-finance-data';
import { addReviewed, removeReviewed, ReviewedItem, reviewedToday } from './reviewed-today';

const ReviewLimit = '500';
const YearLength = 4;
const CategoryShortcut = 'c';

type Decision = {
  categoryId: string | null;
  row: TransactionRow;
  source: ReviewedItem['source'];
};

const reviewMeta = (transaction: TransactionRow, currentYear: string) =>
  [
    transaction.accountName,
    dayLabel(transaction.date, currentYear),
    transaction.status === 'pending' ? 'Pending' : null,
  ]
    .filter(Boolean)
    .join(' · ');

const reviewedItem = (decision: Decision, categories: FlatCategory[]): ReviewedItem => {
  const category = categories.find(candidate => candidate.id === decision.categoryId);

  return {
    accountName: decision.row.accountName,
    amountMinor: decision.row.amountMinor,
    categoryIcon: category?.icon ?? null,
    categoryName: category?.name ?? null,
    currency: decision.row.currency,
    groupColor: category?.color ?? null,
    id: decision.row.id,
    previousCategoryId: decision.row.categoryId,
    source: decision.source,
    title: describeTransaction(decision.row),
  };
};

const focusSibling = (row: HTMLElement, direction: 'next' | 'previous') => {
  const sibling = direction === 'next' ? row.nextElementSibling : row.previousElementSibling;

  if (sibling instanceof HTMLElement) sibling.focus();
};

function ReviewRow({
  currentYear,
  onDecide,
  onOpenChange,
  open,
  suggestion,
  transaction,
}: {
  currentYear: string;
  onDecide: (decision: Decision) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  suggestion?: ReviewSuggestion;
  transaction: TransactionRow;
}) {
  const title = describeTransaction(transaction);
  const suggested = suggestion?.categoryId;

  const confirm = () =>
    onDecide({
      categoryId: suggested ?? transaction.categoryId,
      row: transaction,
      source: suggestion?.source ?? 'manual',
    });

  const onKeyDown = (event: KeyboardEvent<HTMLLIElement>) => {
    if (event.target !== event.currentTarget) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      focusSibling(event.currentTarget, event.key === 'ArrowDown' ? 'next' : 'previous');
    } else if (event.key.toLowerCase() === CategoryShortcut) {
      event.preventDefault();
      onOpenChange(true);
    } else if (event.key === 'Enter') {
      confirm();
    }
  };

  return (
    <li className="review-inbox__row" tabIndex={0} aria-label={title} onKeyDown={onKeyDown}>
      <PayeeAvatar name={title} icon={transaction.payeeIcon} color={transaction.payeeColor} />
      <div className="review-inbox__text">
        <span className="review-inbox__title">{title}</span>
        <span className="review-inbox__meta">{reviewMeta(transaction, currentYear)}</span>
      </div>
      <div className="review-inbox__category">
        <CategoryPicker
          label={`Category for ${title}`}
          kind={transaction.amountMinor < 0 ? 'expense' : 'income'}
          value={suggested ?? transaction.categoryId ?? undefined}
          suggestedId={suggested}
          open={open}
          onOpenChange={onOpenChange}
          onChange={categoryId =>
            onDecide({
              categoryId: categoryId ?? null,
              row: transaction,
              source: 'manual',
            })
          }
        />
        {suggested && (
          <Badge tone="info" icon={<Sparkles aria-hidden />}>
            Suggested
          </Badge>
        )}
      </div>
      <span className="review-inbox__amount">
        <Amount amountMinor={transaction.amountMinor} currency={transaction.currency} signed />
      </span>
      <Button
        className="review-inbox__action"
        size="sm"
        variant={suggested ? 'default' : 'outline'}
        aria-label={`${suggested ? 'Accept' : 'Mark as reviewed'}: ${title}`}
        onClick={confirm}
      >
        <Check aria-hidden /> {suggested ? 'Accept' : 'Done'}
      </Button>
    </li>
  );
}

function ReviewedToday({
  items,
  onUndo,
}: {
  items: ReviewedItem[];
  onUndo: (item: ReviewedItem) => void;
}) {
  if (!items.length) return null;

  return (
    <Panel
      title="Reviewed today"
      description="They stay here until tomorrow, in case you change your mind."
    >
      <ul className="review-inbox__list">
        {items.map(item => (
          <li key={item.id} className="review-inbox__done">
            <PayeeAvatar name={item.title} size="small" />
            <div className="review-inbox__text">
              <span className="review-inbox__title">{item.title}</span>
              <span className="review-inbox__meta">
                {item.accountName}
                {item.source === 'rule' && ' · a rule set the category'}
                {item.source === 'payee' && ' · the usual category for this payee'}
              </span>
            </div>
            <span className="review-inbox__chip">
              {item.categoryName ? (
                <>
                  <Avatar color={item.groupColor} size="small">
                    <Icon icon={item.categoryIcon} />
                  </Avatar>
                  {item.categoryName}
                </>
              ) : (
                'No category'
              )}
            </span>
            <span className="review-inbox__amount">
              <Amount amountMinor={item.amountMinor} currency={item.currency} signed />
            </span>
            <Button
              className="review-inbox__action"
              variant="ghost"
              size="sm"
              aria-label={`Undo review of ${item.title}`}
              onClick={() => onUndo(item)}
            >
              <Undo2 aria-hidden /> Undo
            </Button>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function useReviewedToday(today: string) {
  const hydrated = useHydrated();
  const [, setVersion] = useState(0);
  const bump = () => setVersion(version => version + 1);

  return {
    add: (item: ReviewedItem) => {
      addReviewed(today, item);
      bump();
    },
    items: hydrated ? reviewedToday(today) : [],
    remove: (id: string) => {
      removeReviewed(today, id);
      bump();
    },
  };
}

function useReviewDecisions(today: string) {
  const refresh = useRefreshFinance();
  const categories = useCategories();
  const reviewed = useReviewedToday(today);
  const flat = useMemo(() => flattenCategories(categories.data), [categories.data]);

  const decide = useMutation({
    mutationFn: (decision: Decision) => categorizeTransaction(decision.row.id, decision.categoryId),
    onError: (error: Error) => toast.error(error.message),
    onSuccess: (_row, decision) => {
      reviewed.add(reviewedItem(decision, flat));

      return refresh();
    },
  });

  const undo = useMutation({
    mutationFn: (item: ReviewedItem) => reopenReview(item.id, item.previousCategoryId),
    onError: (error: Error) => toast.error(error.message),
    onSuccess: (_row, item) => {
      reviewed.remove(item.id);

      return refresh();
    },
  });

  return {
    decide,
    reviewed: reviewed.items,
    undo,
  };
}

export function ReviewInbox() {
  const today = localIsoDate(new Date());
  const rows = useTransactions({ limit: ReviewLimit, needsReview: '1' });
  const suggestions = useReviewSuggestions();
  const { decide, reviewed, undo } = useReviewDecisions(today);
  const [openId, setOpenId] = useState<string>();

  const suggestionById = new Map(
    (suggestions.data ?? []).map(suggestion => [suggestion.transactionId, suggestion])
  );

  const pending = rows.data ?? [];
  const withSuggestion = pending.filter(row => suggestionById.has(row.id));

  const acceptAll = async () => {
    for (const row of withSuggestion) {
      const suggestion = suggestionById.get(row.id);

      if (suggestion) {
        await decide.mutateAsync({
          categoryId: suggestion.categoryId,
          row,
          source: suggestion.source,
        });
      }
    }
  };

  return (
    <Page>
      <PageHeading
        title="Review"
        description="New and imported transactions that still need a category. Confirm each one to clear it."
        actions={
          withSuggestion.length > 0 && (
            <Button variant="outline" onClick={() => void acceptAll()} disabled={decide.isPending}>
              <Sparkles aria-hidden /> Accept {withSuggestion.length} suggestion
              {withSuggestion.length === 1 ? '' : 's'}
            </Button>
          )
        }
      />
      <Panel
        title={`${pending.length} to review`}
        action={
          <p className="review-inbox__keys">
            <kbd className="review-inbox__key">↑</kbd> <kbd className="review-inbox__key">↓</kbd>{' '}
            move · <kbd className="review-inbox__key">C</kbd> category ·{' '}
            <kbd className="review-inbox__key">Enter</kbd> done
          </p>
        }
      >
        <QueryContent
          pending={rows.isPending}
          loading="Loading…"
          empty={
            !pending.length && (
              <EmptyState title="All caught up" description="Every transaction has a category." />
            )
          }
        >
          {() => (
            <ul className="review-inbox__list">
              {pending.map(transaction => (
                <ReviewRow
                  key={transaction.id}
                  currentYear={today.slice(0, YearLength)}
                  transaction={transaction}
                  suggestion={suggestionById.get(transaction.id)}
                  open={openId === transaction.id}
                  onOpenChange={open => setOpenId(open ? transaction.id : undefined)}
                  onDecide={decision => decide.mutate(decision)}
                />
              ))}
            </ul>
          )}
        </QueryContent>
      </Panel>
      <ReviewedToday items={reviewed} onUndo={item => undo.mutate(item)} />
    </Page>
  );
}
