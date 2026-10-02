import { and, asc, desc, eq, isNotNull, isNull, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { accounts, categories, categoryGroups, payees, transactionTemplates } from '@/db/schema';
import type { TransactionDirection } from '@coinkeeper/shared/schema/enums';
import {
  MAX_TEMPLATES_PER_USER,
  type TemplateKind,
  type TemplateRow,
  type TemplateUnavailableReason,
} from '@coinkeeper/shared/schema/templates';

import { assertAllFound, assertDistinctIds, positionedIds, rowsOf } from '../batch';
import { ownedActiveCategory } from '../categories/service';
import { conflict, Db, DbOrTx, notFound, ServiceError, toIsoTimestamp } from '../db';
import { isUniqueViolation } from '../errors';
import { assertPayee } from '../ledger/guards';

export type TemplateInput = {
  accountId: null | string;
  amountMinor: null | number;
  categoryId: null | string;
  kind: TemplateKind;
  memo: string;
  name: string;
  payeeId: null | string;
  transferAccountId: null | string;
};

type ListedTemplate = {
  accountArchived: boolean | null;
  accountId: null | string;
  amountMinor: null | number;
  categoryArchived: boolean | null;
  categoryId: null | string;
  currency: null | string;
  deletedAt: Date | null;
  groupKind: null | string;
  id: string;
  kind: string;
  lastUsedAt: Date | null;
  memo: string;
  name: string;
  payeeId: null | string;
  sortOrder: number;
  transferAccountArchived: boolean | null;
  transferAccountId: null | string;
};

const unavailableReason = (row: ListedTemplate): null | TemplateUnavailableReason => {
  if (row.accountArchived) return 'account_archived';
  if (row.transferAccountArchived) return 'transfer_account_archived';
  if (row.categoryArchived) return 'category_archived';

  return null;
};

const directionOf = (row: ListedTemplate): TransactionDirection => {
  if (row.amountMinor !== null) return row.amountMinor < 0 ? 'expense' : 'income';

  return row.groupKind === 'income' ? 'income' : 'expense';
};

const toTemplateRow = (row: ListedTemplate): TemplateRow => ({
  accountId: row.accountId,
  amountMinor: row.amountMinor === null ? null : Number(row.amountMinor),
  categoryId: row.categoryId,
  currency: row.currency,
  deletedAt: toIsoTimestamp(row.deletedAt),
  direction: directionOf(row),
  id: row.id,
  kind: row.kind === 'transfer' ? 'transfer' : 'standard',
  lastUsedAt: toIsoTimestamp(row.lastUsedAt),
  memo: row.memo,
  name: row.name,
  payeeId: row.payeeId,
  sortOrder: row.sortOrder,
  transferAccountId: row.transferAccountId,
  unavailableReason: unavailableReason(row),
});

const assertShape = (input: TemplateInput): void => {
  if (!input.name.trim()) throw new ServiceError('Name is required');

  if (input.amountMinor !== null && !input.accountId) {
    throw new ServiceError('Choose an account to save an amount');
  }

  if (input.amountMinor !== null && (!Number.isInteger(input.amountMinor) || !input.amountMinor)) {
    throw new ServiceError('Amount must be a non-zero whole number of minor units');
  }

  if (input.kind === 'standard' && input.transferAccountId) {
    throw new ServiceError('Only transfer templates have a destination account');
  }

  if (input.kind === 'transfer') assertTransferShape(input);
};

const assertTransferShape = (input: TemplateInput): void => {
  if (input.categoryId || input.payeeId) {
    throw new ServiceError('Transfer templates have no category or payee');
  }

  if (input.amountMinor !== null && input.amountMinor < 0) {
    throw new ServiceError('Transfer amounts are positive');
  }

  if (input.accountId && input.accountId === input.transferAccountId) {
    throw new ServiceError('Transfer accounts must be different');
  }
};

const assertUsableAccount = async (tx: DbOrTx, userId: string, id: string): Promise<void> => {
  const [account] = await tx
    .select({ archivedAt: accounts.archivedAt })
    .from(accounts)
    .where(and(eq(accounts.id, id), eq(accounts.userId, userId), isNull(accounts.deletedAt)));

  if (!account) notFound('Account');
  if (account.archivedAt) throw new ServiceError('This account is archived');
};

const assertReferences = async (db: Db, userId: string, input: TemplateInput): Promise<void> => {
  if (input.accountId) await assertUsableAccount(db, userId, input.accountId);
  if (input.transferAccountId) await assertUsableAccount(db, userId, input.transferAccountId);
  if (input.categoryId) await ownedActiveCategory(db, userId, input.categoryId);
  if (input.payeeId) await assertPayee(db, userId, input.payeeId);
};

const columnsOf = (input: TemplateInput) => ({
  accountId: input.accountId,
  amountMinor: input.amountMinor,
  categoryId: input.kind === 'standard' ? input.categoryId : null,
  kind: input.kind,
  memo: input.memo.trim(),
  name: input.name.trim(),
  payeeId: input.kind === 'standard' ? input.payeeId : null,
  transferAccountId: input.kind === 'transfer' ? input.transferAccountId : null,
});

const sortTemplates = (tx: DbOrTx, userId: string, orderedIds: string[]) =>
  rowsOf<{ id: string }>(
    tx,
    sql`
    UPDATE transaction_templates AS template
    SET sort_order = ordered.position, updated_at = now()
    FROM (VALUES ${positionedIds(orderedIds)}) AS ordered(id, position)
    WHERE template.id = ordered.id AND template.user_id = ${userId} AND template.deleted_at IS NULL
    RETURNING template.id`
  );

const withUniqueName = async <Result>(write: () => Promise<Result>): Promise<Result> => {
  try {
    return await write();
  } catch (error) {
    if (isUniqueViolation(error)) conflict('A template with this name already exists');

    throw error;
  }
};

export const markTemplateUsed = async (
  tx: DbOrTx,
  userId: string,
  templateId: string | undefined
): Promise<void> => {
  if (!templateId) return;

  await tx
    .update(transactionTemplates)
    .set({ lastUsedAt: new Date() })
    .where(
      and(
        eq(transactionTemplates.id, templateId),
        eq(transactionTemplates.userId, userId),
        isNull(transactionTemplates.deletedAt)
      )
    );
};

const transferAccount = alias(accounts, 'transfer_account');

const liveCondition = (deleted: boolean) =>
  deleted ? isNotNull(transactionTemplates.deletedAt) : isNull(transactionTemplates.deletedAt);

const listTemplates = async (
  db: Db,
  userId: string,
  { deleted = false, id }: { deleted?: boolean; id?: string } = {}
): Promise<TemplateRow[]> => {
  const rows = await db
    .select({
      accountArchived: sql<
        boolean | null
      >`${accounts.archivedAt} IS NOT NULL OR ${accounts.deletedAt} IS NOT NULL`,
      accountId: transactionTemplates.accountId,
      amountMinor: transactionTemplates.amountMinor,
      categoryArchived: sql<boolean | null>`${categories.archivedAt} IS NOT NULL`,
      categoryId: transactionTemplates.categoryId,
      currency: accounts.currency,
      deletedAt: transactionTemplates.deletedAt,
      groupKind: categoryGroups.kind,
      id: transactionTemplates.id,
      kind: transactionTemplates.kind,
      lastUsedAt: transactionTemplates.lastUsedAt,
      memo: transactionTemplates.memo,
      name: transactionTemplates.name,
      payeeId: sql<null | string>`CASE WHEN ${payees.archivedAt} IS NULL THEN ${payees.id} END`,
      sortOrder: transactionTemplates.sortOrder,
      transferAccountArchived: sql<
        boolean | null
      >`${transferAccount.archivedAt} IS NOT NULL OR ${transferAccount.deletedAt} IS NOT NULL`,
      transferAccountId: transactionTemplates.transferAccountId,
    })
    .from(transactionTemplates)
    .leftJoin(accounts, eq(accounts.id, transactionTemplates.accountId))
    .leftJoin(transferAccount, eq(transferAccount.id, transactionTemplates.transferAccountId))
    .leftJoin(categories, eq(categories.id, transactionTemplates.categoryId))
    .leftJoin(categoryGroups, eq(categoryGroups.id, categories.groupId))
    .leftJoin(payees, eq(payees.id, transactionTemplates.payeeId))
    .where(
      and(
        eq(transactionTemplates.userId, userId),
        liveCondition(deleted),
        id ? eq(transactionTemplates.id, id) : undefined
      )
    )
    .orderBy(
      asc(transactionTemplates.sortOrder),
      desc(transactionTemplates.lastUsedAt),
      asc(transactionTemplates.name)
    );

  return rows.map(toTemplateRow);
};

const getTemplate = async (db: Db, userId: string, id: string): Promise<TemplateRow> => {
  const [row] = await listTemplates(db, userId, { id });

  return row ?? notFound('Template');
};

const ownedTemplate = async (db: Db, userId: string, id: string, { deleted = false } = {}) => {
  const [template] = await db
    .select({ id: transactionTemplates.id })
    .from(transactionTemplates)
    .where(
      and(
        eq(transactionTemplates.id, id),
        eq(transactionTemplates.userId, userId),
        liveCondition(deleted)
      )
    )
    .limit(1);

  return template ?? notFound(deleted ? 'Deleted template' : 'Template');
};

const liveSummary = async (db: Db, userId: string) => {
  const [summary] = await db
    .select({
      count: sql<number>`count(*)::int`,
      next: sql<number>`COALESCE(max(${transactionTemplates.sortOrder}), -1) + 1`,
    })
    .from(transactionTemplates)
    .where(and(eq(transactionTemplates.userId, userId), isNull(transactionTemplates.deletedAt)));

  return { count: Number(summary.count), next: Number(summary.next) };
};

const assertRoom = (liveCount: number): void => {
  if (liveCount >= MAX_TEMPLATES_PER_USER) {
    throw new ServiceError(`You can keep up to ${MAX_TEMPLATES_PER_USER} templates`);
  }
};

export const createTemplateService = (db: Db) => ({
  async create(userId: string, input: TemplateInput): Promise<TemplateRow> {
    assertShape(input);
    await assertReferences(db, userId, input);

    const { count, next } = await liveSummary(db, userId);

    assertRoom(count);

    const [created] = await withUniqueName(() =>
      db
        .insert(transactionTemplates)
        .values({
          ...columnsOf(input),
          sortOrder: next,
          userId,
        })
        .returning({ id: transactionTemplates.id })
    );

    return getTemplate(db, userId, created.id);
  },
  get: (userId: string, id: string) => getTemplate(db, userId, id),
  list: (userId: string, options?: { deleted?: boolean }) => listTemplates(db, userId, options),
  async remove(userId: string, id: string): Promise<void> {
    await ownedTemplate(db, userId, id);
    await db
      .update(transactionTemplates)
      .set({ deletedAt: new Date() })
      .where(eq(transactionTemplates.id, id));
  },
  async reorder(userId: string, orderedIds: string[]): Promise<void> {
    assertDistinctIds(orderedIds);
    await db.transaction(async tx => {
      assertAllFound((await sortTemplates(tx, userId, orderedIds)).length, orderedIds, 'Template');
    });
  },
  async restore(userId: string, id: string): Promise<TemplateRow> {
    await ownedTemplate(db, userId, id, { deleted: true });
    assertRoom((await liveSummary(db, userId)).count);
    await withUniqueName(() =>
      db
        .update(transactionTemplates)
        .set({ deletedAt: null })
        .where(eq(transactionTemplates.id, id))
    );

    return getTemplate(db, userId, id);
  },
  async update(userId: string, id: string, input: TemplateInput): Promise<TemplateRow> {
    await ownedTemplate(db, userId, id);
    assertShape(input);
    await assertReferences(db, userId, input);
    await withUniqueName(() =>
      db.update(transactionTemplates).set(columnsOf(input)).where(eq(transactionTemplates.id, id))
    );

    return getTemplate(db, userId, id);
  },
});
