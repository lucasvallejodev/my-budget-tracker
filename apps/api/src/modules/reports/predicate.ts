import { sql } from 'drizzle-orm';

export const spendingWhere = sql`t.deleted_at IS NULL AND a.deleted_at IS NULL AND t.kind = 'standard' AND NOT t.excluded AND a.counts_in_spending`;
