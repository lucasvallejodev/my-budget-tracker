'use client';

import './transaction-table.scss';

import { useMutation } from '@tanstack/react-query';
import { ArrowLeftRight } from 'lucide-react';
import { toast } from 'sonner';

import { categorizeTransaction } from '@/api/mutations';
import { Amount, Avatar, Badge, EmptyState, Icon } from '@/components/ui';
import { cn } from '@/lib/styles';
import { localIsoDate } from '@coinkeeper/shared/lib/date-helpers';
import { formatMoney } from '@coinkeeper/shared/lib/money';

import { CategoryPicker } from '../category-picker';
import { PayeeAvatar } from '../payee-avatar';
import { TransactionActions } from '../transaction-actions';
import { dayLabel, describeTransaction } from '../transaction-labels';
import { TransactionRow, useRefreshFinance } from '../use-finance-data';
import { SplitCategories } from './split-categories';
import { collapseTransfers, groupByDay, ListedTransaction } from './transaction-groups';

const YearLength = 4;

function TransactionStatus({ transaction }: { transaction: ListedTransaction }) {
  if (transaction.status === 'pending') return <Badge tone="neutral">Pending</Badge>;

  if (transaction.needsReview && transaction.categoryId) {
    return <Badge tone="warning">Needs review</Badge>;
  }

  if (transaction.status === 'reconciled') return <Badge tone="info">Reconciled</Badge>;
  if (transaction.excluded) return <Badge tone="neutral">Excluded</Badge>;

  return null;
}

const transferTitle = (transaction: ListedTransaction) =>
  transaction.pairedWith
    ? `${transaction.accountName} → ${transaction.pairedWith.accountName}`
    : describeTransaction(transaction);

const secondLine = (transaction: ListedTransaction) => {
  if (transaction.kind === 'transfer') return 'Not counted as spending';
  if (transaction.payeeName && transaction.memo) return transaction.memo;

  if (transaction.payeeName && transaction.originalPayee !== transaction.payeeName) {
    return transaction.originalPayee;
  }

  if (transaction.splits.length) return null;

  return transaction.needsReview && !transaction.categoryId ? 'Bank text kept as imported' : null;
};

function RowAvatar({ transaction }: { transaction: ListedTransaction }) {
  if (transaction.kind === 'transfer') {
    return (
      <Avatar>
        <ArrowLeftRight />
      </Avatar>
    );
  }

  return (
    <PayeeAvatar
      name={describeTransaction(transaction)}
      icon={transaction.payeeIcon}
      color={transaction.payeeColor}
    />
  );
}

function CategoryCell({
  onCategorize,
  transaction,
}: {
  onCategorize: (categoryId: string | undefined) => void;
  transaction: ListedTransaction;
}) {
  if (transaction.kind === 'transfer') {
    return <span className="transaction-table__chip">Transfer</span>;
  }

  if (transaction.kind === 'opening') {
    return <span className="transaction-table__chip">Opening balance</span>;
  }

  if (transaction.splits.length) return <SplitCategories transaction={transaction} />;

  if (!transaction.categoryId) {
    return (
      <CategoryPicker
        variant="chip"
        placeholder="Categorize"
        label={`Category for ${describeTransaction(transaction)}`}
        kind={transaction.amountMinor < 0 ? 'expense' : 'income'}
        onChange={onCategorize}
      />
    );
  }

  return (
    <span className="transaction-table__chip">
      <Avatar color={transaction.groupColor} size="small">
        <Icon icon={transaction.categoryIcon} />
      </Avatar>
      {transaction.categoryName}
    </span>
  );
}

function RowMeta({
  showAccount,
  transaction,
}: {
  showAccount: boolean;
  transaction: ListedTransaction;
}) {
  const detail = secondLine(transaction);

  if (!detail && !showAccount) return null;

  return (
    <span className="transaction-table__meta">
      {showAccount && (
        <span className="transaction-table__compact-account">
          {transaction.accountName}
          {detail && ' · '}
        </span>
      )}
      {detail}
    </span>
  );
}

function TransactionListRow({
  onCategorize,
  showAccount,
  showActions,
  transaction,
}: {
  onCategorize: (id: string, categoryId: string | undefined) => void;
  showAccount: boolean;
  showActions: boolean;
  transaction: ListedTransaction;
}) {
  const isTransfer = transaction.kind === 'transfer';

  return (
    <li
      className={cn('transaction-table__row', {
        'transaction-table__row--split': transaction.splits.length > 0,
      })}
    >
      <RowAvatar transaction={transaction} />
      <div className="transaction-table__payee">
        <span className="transaction-table__title">
          {isTransfer ? transferTitle(transaction) : describeTransaction(transaction)}
        </span>
        <RowMeta showAccount={showAccount && !isTransfer} transaction={transaction} />
      </div>
      <div className="transaction-table__category">
        <CategoryCell
          transaction={transaction}
          onCategorize={categoryId => onCategorize(transaction.id, categoryId)}
        />
      </div>
      {showAccount && (
        <span className="transaction-table__account">
          {isTransfer && transaction.pairedWith ? '' : transaction.accountName}
        </span>
      )}
      <div className="transaction-table__amount">
        <Amount
          amountMinor={isTransfer ? Math.abs(transaction.amountMinor) : transaction.amountMinor}
          currency={transaction.currency}
          signed={!isTransfer}
          className={isTransfer ? 'transaction-table__transfer-amount' : undefined}
        />
        <TransactionStatus transaction={transaction} />
      </div>
      {showActions && (
        <div className="transaction-table__actions">
          <TransactionActions transaction={transaction} />
        </div>
      )}
    </li>
  );
}

export function TransactionTable({
  showAccount = true,
  showActions = false,
  transactions,
}: {
  showAccount?: boolean;
  showActions?: boolean;
  transactions: TransactionRow[];
}) {
  const refresh = useRefreshFinance();

  const categorize = useMutation({
    mutationFn: ({ categoryId, id }: { categoryId: string | null; id: string }) =>
      categorizeTransaction(id, categoryId),
    onError: (error: Error) => toast.error(error.message),
    onSuccess: refresh,
  });

  if (!transactions.length) return <EmptyState title="No transactions yet" />;

  const currentYear = localIsoDate(new Date()).slice(0, YearLength);
  const days = groupByDay(collapseTransfers(transactions));

  return (
    <div
      className={cn('transaction-table', {
        'transaction-table--actions': showActions,
        'transaction-table--no-account': !showAccount,
      })}
      role="region"
      aria-label="Transactions"
    >
      <div className="transaction-table__head" aria-hidden>
        <span>Payee</span>
        <span>Category</span>
        {showAccount && <span>Account</span>}
        <span className="transaction-table__head-amount">Amount</span>
        {showActions && <span />}
      </div>
      {days.map(day => (
        <section key={day.date} aria-label={dayLabel(day.date, currentYear)}>
          <h3 className="transaction-table__day">
            <span>{dayLabel(day.date, currentYear)}</span>
            <span className="transaction-table__day-total">
              {day.totals
                .map(total =>
                  formatMoney(total.amountMinor, total.currency, { signDisplay: 'exceptZero' })
                )
                .join(' · ')}
            </span>
          </h3>
          <ul className="transaction-table__rows">
            {day.rows.map(transaction => (
              <TransactionListRow
                key={transaction.id}
                transaction={transaction}
                showAccount={showAccount}
                showActions={showActions}
                onCategorize={(id, categoryId) =>
                  categorize.mutate({ categoryId: categoryId ?? null, id })
                }
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
