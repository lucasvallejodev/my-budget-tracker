import { Icon } from './icon';
import { CATEGORY } from '@/constants/category';
import { money, StatusBadge, EmptyState } from './finance/blocks';
import { TransactionActions } from './finance/transaction-explorer';
import s from './finance/finance.module.scss';
export type Transaction = {
  id: string;
  category?: string;
  categoryId?: string;
  accountId?: string;
  type: string;
  amount: number;
  description: string;
  date: Date | string;
  categoryIcon?: string;
  status?: string;
};
export function TransactionTable({
  transactions,
  showActions = false,
}: {
  transactions: Transaction[];
  showActions?: boolean;
}) {
  if (!transactions.length) return <EmptyState title="No transactions yet" />;
  return (
    <div className={s.tableWrap}>
      <table className={s.table}>
        <thead>
          <tr>
            <th scope="col">Description</th>
            <th scope="col">Category</th>
            <th scope="col">Amount</th>
            <th scope="col">Date</th>
            {transactions.some(t => t.status) && <th scope="col">Status</th>}
            {showActions && <th scope="col">Action</th>}
          </tr>
        </thead>
        <tbody>
          {transactions.map(t => {
            const category = CATEGORY[t.categoryId as keyof typeof CATEGORY];
            return (
              <tr key={t.id}>
                <td>
                  <div className={s.description}>
                    <span className={s.metricIcon}>
                      <Icon icon={t.categoryIcon || category?.icon} />
                    </span>
                    {t.description || category?.name || 'Transaction'}
                  </div>
                </td>
                <td>{category?.name || t.category || 'Uncategorized'}</td>
                <td>
                  <span className={t.type === 'INCOME' ? s.positive : undefined}>
                    {t.type === 'INCOME' ? '+' : '−'}
                    {money(Number(t.amount))}
                  </span>
                </td>
                <td>
                  {new Date(t.date).toLocaleDateString('en-US', {
                    timeZone: 'UTC',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </td>
                {transactions.some(row => row.status) && (
                  <td>
                    {t.status && (
                      <StatusBadge
                        tone={
                          t.status === 'Failed'
                            ? 'danger'
                            : t.status === 'Pending'
                              ? 'warning'
                              : 'success'
                        }
                      >
                        {t.status}
                      </StatusBadge>
                    )}
                  </td>
                )}
                {showActions && (
                  <td>
                    <TransactionActions transaction={t} />
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
