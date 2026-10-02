import { and, asc, eq, inArray, isNull, sql } from 'drizzle-orm';

import { categories, categoryGroups, transactionSplits } from '@/db/schema';
import {
  MAX_SPLIT_LINES,
  MIN_SPLIT_LINES,
  type TransactionSplit,
} from '@coinkeeper/shared/schema/transaction';

import { notFound, ServiceError } from '../db';
import type { DbOrTx } from '../db';
import type { SplitInput } from './types';

const lineSum = (lines: SplitInput[]): number =>
  lines.reduce((sum, line) => sum + line.amountMinor, 0);

export const assertSplitLines = (amountMinor: number, lines: SplitInput[]): void => {
  if (lines.length < MIN_SPLIT_LINES) {
    throw new ServiceError(`A split needs at least ${MIN_SPLIT_LINES} lines`);
  }

  if (lines.length > MAX_SPLIT_LINES) {
    throw new ServiceError(`A split can have at most ${MAX_SPLIT_LINES} lines`);
  }

  const sameSign = lines.every(
    line =>
      Number.isInteger(line.amountMinor) && Math.sign(line.amountMinor) === Math.sign(amountMinor)
  );

  if (!sameSign) {
    throw new ServiceError('Every split line must be a non-zero amount in the same direction');
  }

  if (lineSum(lines) !== amountMinor) {
    throw new ServiceError('The split lines must add up to the transaction amount');
  }
};

export const assertSplitCategories = async (
  tx: DbOrTx,
  userId: string,
  lines: SplitInput[]
): Promise<void> => {
  const ids = [...new Set(lines.map(line => line.categoryId))];

  const found = await tx
    .select({ id: categories.id })
    .from(categories)
    .where(
      and(eq(categories.userId, userId), isNull(categories.archivedAt), inArray(categories.id, ids))
    );

  if (found.length !== ids.length) notFound('Category');
};

export const hasLiveSplits = async (tx: DbOrTx, transactionId: string): Promise<boolean> => {
  const [row] = await tx
    .select({ id: transactionSplits.id })
    .from(transactionSplits)
    .where(
      and(eq(transactionSplits.transactionId, transactionId), isNull(transactionSplits.deletedAt))
    )
    .limit(1);

  return !!row;
};

export const removeSplits = async (tx: DbOrTx, transactionIds: string[]): Promise<void> => {
  await tx
    .update(transactionSplits)
    .set({ deletedAt: new Date() })
    .where(
      and(
        inArray(transactionSplits.transactionId, transactionIds),
        isNull(transactionSplits.deletedAt)
      )
    );
};

export const replaceSplits = async (
  tx: DbOrTx,
  userId: string,
  transactionId: string,
  lines: SplitInput[]
): Promise<void> => {
  await removeSplits(tx, [transactionId]);
  await tx.insert(transactionSplits).values(
    lines.map((line, index) => ({
      amountMinor: line.amountMinor,
      categoryId: line.categoryId,
      memo: line.memo.trim(),
      sortOrder: index,
      transactionId,
      userId,
    }))
  );
};

export const uncategorizeArchivedLines = async (
  tx: DbOrTx,
  transactionId: string
): Promise<boolean> => {
  const cleared = await tx
    .update(transactionSplits)
    .set({ categoryId: null })
    .where(
      and(
        eq(transactionSplits.transactionId, transactionId),
        isNull(transactionSplits.deletedAt),
        sql`${transactionSplits.categoryId} IN (SELECT id FROM categories WHERE archived_at IS NOT NULL)`
      )
    )
    .returning({ id: transactionSplits.id });

  return cleared.length > 0;
};

export const splitsByTransaction = async (
  tx: DbOrTx,
  userId: string,
  transactionIds: string[]
): Promise<Map<string, TransactionSplit[]>> => {
  const byTransaction = new Map<string, TransactionSplit[]>();

  if (!transactionIds.length) return byTransaction;

  const rows = await tx
    .select({
      amountMinor: transactionSplits.amountMinor,
      categoryIcon: categories.icon,
      categoryId: transactionSplits.categoryId,
      categoryName: categories.name,
      groupColor: categoryGroups.color,
      id: transactionSplits.id,
      memo: transactionSplits.memo,
      transactionId: transactionSplits.transactionId,
    })
    .from(transactionSplits)
    .leftJoin(categories, eq(categories.id, transactionSplits.categoryId))
    .leftJoin(categoryGroups, eq(categoryGroups.id, categories.groupId))
    .where(
      and(
        eq(transactionSplits.userId, userId),
        isNull(transactionSplits.deletedAt),
        inArray(transactionSplits.transactionId, transactionIds)
      )
    )
    .orderBy(asc(transactionSplits.sortOrder));

  for (const { transactionId, ...line } of rows) {
    const lines = byTransaction.get(transactionId) ?? [];

    lines.push({ ...line, amountMinor: Number(line.amountMinor) });
    byTransaction.set(transactionId, lines);
  }

  return byTransaction;
};
