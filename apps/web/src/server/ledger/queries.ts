import { and, desc, eq, gte, ilike, inArray, isNull, lt, or, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { accounts, categories, categoryGroups, payees, transactions } from '@/db/schema';
import { isoDateOfMonthStart } from '@coinkeeper/shared/lib/date-helpers';
import { isIsoMonth } from '@coinkeeper/shared/lib/patterns';

import { notFound, ServiceError } from '../db';
import type { Db } from '../db';
import type { ListFilters, TransactionRow } from './types';

const DEFAULT_LIMIT = 500;
const MAX_LIMIT = 2000;

export const monthRange = (month: string) => {
  if (!isIsoMonth(month)) throw new ServiceError('Month must be YYYY-MM');
  const start = `${month}-01`;
  const next = isoDateOfMonthStart(month, 1);

  return { end: next, start };
};

const dateConditions = (filters: ListFilters): SQL[] => {
  const conditions: SQL[] = [];

  if (filters.month) {
    const { end, start } = monthRange(filters.month);

    conditions.push(gte(transactions.date, start), lt(transactions.date, end));
  }

  if (filters.from) conditions.push(gte(transactions.date, filters.from));
  if (filters.to) conditions.push(sql`${transactions.date} <= ${filters.to}`);

  return conditions;
};

const searchCondition = (search: string): SQL | undefined => {
  const term = `%${search}%`;

  return or(
    ilike(transactions.memo, term),
    ilike(payees.name, term),
    ilike(transactions.originalPayee, term),
    ilike(categories.name, term)
  );
};

const buildListWhere = (userId: string, filters: ListFilters): SQL | undefined => {
  const conditions: (SQL | undefined)[] = [
    eq(transactions.userId, userId),
    isNull(transactions.deletedAt),
    ...dateConditions(filters),
  ];

  if (filters.accountId) conditions.push(eq(transactions.accountId, filters.accountId));
  if (filters.categoryId) conditions.push(eq(transactions.categoryId, filters.categoryId));
  if (filters.needsReview) conditions.push(eq(transactions.needsReview, true));
  if (filters.kind) conditions.push(eq(transactions.kind, filters.kind));
  if (filters.ids) conditions.push(inArray(transactions.id, filters.ids));
  if (filters.search) conditions.push(searchCondition(filters.search));

  return and(...conditions);
};

export const list = async (
  db: Db,
  userId: string,
  filters: ListFilters = {}
): Promise<TransactionRow[]> => {
  const peer = alias(transactions, 'peer');
  const peerAccount = alias(accounts, 'peer_account');

  const rows = await db
    .select({
      accountCurrency: accounts.currency,
      accountId: transactions.accountId,
      accountName: accounts.name,
      amountMinor: transactions.amountMinor,
      categoryIcon: categories.icon,
      categoryId: transactions.categoryId,
      categoryName: categories.name,
      counterpartAccountId: peerAccount.id,
      counterpartAccountName: peerAccount.name,
      currency: transactions.currency,
      date: transactions.date,
      excluded: transactions.excluded,
      groupColor: categoryGroups.color,
      groupId: categoryGroups.id,
      groupKind: categoryGroups.kind,
      groupName: categoryGroups.name,
      id: transactions.id,
      importId: transactions.importId,
      kind: transactions.kind,
      memo: transactions.memo,
      needsReview: transactions.needsReview,
      originalPayee: transactions.originalPayee,
      payeeId: transactions.payeeId,
      payeeName: payees.name,
      status: transactions.status,
      transferId: transactions.transferId,
    })
    .from(transactions)
    .innerJoin(accounts, eq(accounts.id, transactions.accountId))
    .leftJoin(categories, eq(categories.id, transactions.categoryId))
    .leftJoin(categoryGroups, eq(categoryGroups.id, categories.groupId))
    .leftJoin(payees, eq(payees.id, transactions.payeeId))
    .leftJoin(
      peer,
      and(
        eq(peer.transferId, transactions.transferId),
        sql`${peer.id} <> ${transactions.id}`,
        isNull(peer.deletedAt)
      )
    )
    .leftJoin(peerAccount, eq(peerAccount.id, peer.accountId))
    .where(buildListWhere(userId, filters))
    .orderBy(desc(transactions.date), desc(transactions.createdAt))
    .limit(Math.min(filters.limit ?? DEFAULT_LIMIT, MAX_LIMIT))
    .offset(filters.offset ?? 0);

  return rows.map(row => ({
    ...row,
    amountMinor: Number(row.amountMinor),
    deletedAt: null,
  }));
};

export const get = async (db: Db, userId: string, id: string): Promise<TransactionRow> => {
  const [row] = await list(db, userId, { ids: [id], limit: 1 });

  return row ?? notFound('Transaction');
};

export const needsReviewCount = async (db: Db, userId: string): Promise<number> => {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.needsReview, true),
        isNull(transactions.deletedAt)
      )
    );

  return Number(count);
};
