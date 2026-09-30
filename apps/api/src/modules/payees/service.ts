import { and, asc, desc, eq, inArray, isNull } from 'drizzle-orm';

import { categories, payees, transactions } from '@/db/schema';
import { chunk } from '@coinkeeper/shared/lib/arrays';
import type { PayeeRow } from '@coinkeeper/shared/schema/payees';

import { WRITE_CHUNK_ROWS } from '../batch';
import { conflict, Db, DbOrTx, notFound, toIsoTimestamp } from '../db';
import { isUniqueViolation } from '../errors';

const RECENT_TRANSACTIONS_SAMPLE = 3;
const MAJORITY_OF_SAMPLE = 2;

type PayeeRecord = typeof payees.$inferSelect;

type PayeeAppearance = {
  color?: string | null;
  icon?: string | null;
};

type PayeeInput = PayeeAppearance & {
  defaultCategoryId?: string | null;
  name: string;
};

type PayeePatch = Partial<PayeeInput>;

const toPayee = (row: PayeeRecord): PayeeRow => ({
  archivedAt: toIsoTimestamp(row.archivedAt),
  color: row.color,
  defaultCategoryId: row.defaultCategoryId,
  icon: row.icon,
  id: row.id,
  name: row.name,
});

const nameTaken = (): never => conflict('A payee with that name already exists');

export const payeeNameKey = (name: string): string => name.trim().toLowerCase();

const distinctNames = (names: string[]): string[] => {
  const byKey = new Map<string, string>();

  for (const name of names) {
    const trimmed = name.trim();

    if (trimmed && !byKey.has(payeeNameKey(trimmed))) byKey.set(payeeNameKey(trimmed), trimmed);
  }

  return [...byKey.values()];
};

const indexByName = (target: Map<string, PayeeRecord>, rows: PayeeRecord[]): void => {
  for (const row of rows) {
    if (!target.has(payeeNameKey(row.name))) target.set(payeeNameKey(row.name), row);
  }
};

export const resolvePayeesByName = async (
  tx: DbOrTx,
  userId: string,
  names: string[]
): Promise<Map<string, PayeeRecord>> => {
  const byName = new Map<string, PayeeRecord>();

  indexByName(
    byName,
    await tx.select().from(payees).where(eq(payees.userId, userId)).orderBy(asc(payees.createdAt))
  );

  const missing = distinctNames(names).filter(name => !byName.has(payeeNameKey(name)));

  for (const slice of chunk(missing, WRITE_CHUNK_ROWS)) {
    await tx
      .insert(payees)
      .values(slice.map(name => ({ name, userId })))
      .onConflictDoNothing({ target: [payees.userId, payees.name] });
    indexByName(
      byName,
      await tx
        .select()
        .from(payees)
        .where(and(eq(payees.userId, userId), inArray(payees.name, slice)))
    );
  }

  return byName;
};

export const learnDefaultCategory = async (
  db: DbOrTx,
  userId: string,
  payeeId: string
): Promise<void> => {
  const recent = await db
    .select({ categoryId: transactions.categoryId })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.payeeId, payeeId),
        eq(transactions.kind, 'standard'),
        isNull(transactions.deletedAt)
      )
    )
    .orderBy(desc(transactions.date), desc(transactions.createdAt))
    .limit(RECENT_TRANSACTIONS_SAMPLE);

  const tally = new Map<string, number>();

  for (const row of recent) {
    if (row.categoryId) tally.set(row.categoryId, (tally.get(row.categoryId) ?? 0) + 1);
  }

  const winner = [...tally.entries()].find(([, count]) => count >= MAJORITY_OF_SAMPLE)?.[0];
  const fallback = recent.length < MAJORITY_OF_SAMPLE ? recent[0]?.categoryId : undefined;
  const next = winner ?? fallback;

  if (next) {
    await db
      .update(payees)
      .set({ defaultCategoryId: next })
      .where(and(eq(payees.id, payeeId), eq(payees.userId, userId)));
  }
};

export const createPayeeService = (db: Db) => {
  const find = async (userId: string, id: string) => {
    const [payee] = await db
      .select()
      .from(payees)
      .where(and(eq(payees.id, id), eq(payees.userId, userId)))
      .limit(1);

    return payee ?? notFound('Payee');
  };

  const owned = async (userId: string, id: string) => {
    const payee = await find(userId, id);

    return payee.archivedAt ? notFound('Payee') : payee;
  };

  const assertCategory = async (userId: string, categoryId: string) => {
    const [category] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)));

    if (!category) notFound('Category');
  };

  const setArchived = async (userId: string, id: string, archived: boolean) => {
    await find(userId, id);

    const [updated] = await db
      .update(payees)
      .set({ archivedAt: archived ? new Date() : null })
      .where(eq(payees.id, id))
      .returning();

    return toPayee(updated);
  };

  return {
    archive: (userId: string, id: string) => setArchived(userId, id, true),
    async create(userId: string, data: PayeeInput): Promise<PayeeRow> {
      if (data.defaultCategoryId) await assertCategory(userId, data.defaultCategoryId);

      try {
        const [payee] = await db
          .insert(payees)
          .values({
            ...data,
            defaultCategoryId: data.defaultCategoryId || null,
            name: data.name.trim(),
            userId,
          })
          .returning();

        return toPayee(payee);
      } catch (error) {
        if (isUniqueViolation(error)) return nameTaken();
        throw error;
      }
    },
    learnDefaultCategory: (userId: string, payeeId: string) =>
      learnDefaultCategory(db, userId, payeeId),
    async list(userId: string, { includeArchived = false } = {}): Promise<PayeeRow[]> {
      const rows = await db
        .select()
        .from(payees)
        .where(
          and(eq(payees.userId, userId), includeArchived ? undefined : isNull(payees.archivedAt))
        )
        .orderBy(asc(payees.name));

      return rows.map(toPayee);
    },
    owned,
    unarchive: (userId: string, id: string) => setArchived(userId, id, false),
    async update(userId: string, id: string, data: PayeePatch): Promise<PayeeRow> {
      await owned(userId, id);
      if (data.defaultCategoryId) await assertCategory(userId, data.defaultCategoryId);

      try {
        const [updated] = await db
          .update(payees)
          .set({ ...data, name: data.name?.trim() })
          .where(eq(payees.id, id))
          .returning();

        return toPayee(updated);
      } catch (error) {
        if (isUniqueViolation(error)) return nameTaken();
        throw error;
      }
    },
  };
};
