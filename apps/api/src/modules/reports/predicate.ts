import { sql } from 'drizzle-orm';

export const spendingWhere = sql`t.deleted_at IS NULL AND a.deleted_at IS NULL AND t.kind = 'standard' AND NOT t.excluded AND a.counts_in_spending`;

export const categoryLines = sql`(
  SELECT tx.id, tx.user_id, tx.account_id, tx.payee_id, tx.currency, tx.date, tx.kind, tx.excluded,
    tx.deleted_at, tx.original_payee, tx.memo,
    CASE WHEN line.id IS NULL THEN tx.category_id ELSE line.category_id END AS category_id,
    COALESCE(line.amount_minor, tx.amount_minor) AS amount_minor
  FROM transactions tx
  LEFT JOIN transaction_splits line ON line.transaction_id = tx.id AND line.deleted_at IS NULL
)`;
