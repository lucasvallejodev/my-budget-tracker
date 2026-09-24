import { and, desc, eq, gte, ilike, inArray, isNotNull, isNull, lt, or, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { HttpStatus } from '@/constants/http';
import { accounts, categories, categoryGroups, payees, transactions } from '@/db/schema';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@coinkeeper/shared/constants/pagination';
import { isoDateOfMonthStart } from '@coinkeeper/shared/lib/date-helpers';
import { isIsoMonth } from '@coinkeeper/shared/lib/patterns';
import type { PageResponse } from '@coinkeeper/shared/schema/common';

import { notFound, ServiceError, toIsoTimestamp } from '../db';
import type { Db, DbOrTx } from '../db';
import type { ListFilters, TransactionRow } from './types';

type CursorKey = {
  createdAt: string;
  date: string;
  id: string;
};

type ListedRow = TransactionRow & { cursorCreatedAt: string };

const LikeWildcards = ['\\', '%', '_'];

export const monthRange = (month: string) => {
  if (!isIsoMonth(month)) throw new ServiceError('Month must be YYYY-MM');
  const start = `${month}-01`;
  const next = isoDateOfMonthStart(month, 1);

  return { end: next, start };
};

const encodeCursor = (key: CursorKey): string =>
  Buffer.from(JSON.stringify(key)).toString('base64url');

const decodeCursor = (cursor: string): CursorKey => {
  try {
    const key = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as CursorKey;

    if (
      typeof key.date === 'string' &&
      typeof key.createdAt === 'string' &&
      typeof key.id === 'string'
    ) {
      return key;
    }
  } catch {}

  throw new ServiceError('The cursor is not valid', HttpStatus.badRequest);
};

const escapeLike = (text: string): string =>
  LikeWildcards.reduce((escaped, wildcard) => escaped.replaceAll(wildcard, `\\${wildcard}`), text);

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
  const term = `%${escapeLike(search)}%`;

  return or(
    ilike(transactions.memo, term),
    ilike(payees.name, term),
    ilike(transactions.originalPayee, term),
    ilike(categories.name, term)
  );
};

const deletionCondition = (filters: ListFilters): SQL | undefined => {
  if (filters.includeDeleted) return undefined;

  return filters.deleted ? isNotNull(transactions.deletedAt) : isNull(transactions.deletedAt);
};

const cursorCondition = (cursor: string): SQL => {
  const key = decodeCursor(cursor);

  return sql`(${transactions.date}, ${transactions.createdAt}, ${transactions.id}) < (${key.date}::date, ${key.createdAt}::timestamptz, ${key.id})`;
};

const buildListWhere = (userId: string, filters: ListFilters): SQL | undefined => {
  const conditions: (SQL | undefined)[] = [
    eq(transactions.userId, userId),
    deletionCondition(filters),
    ...dateConditions(filters),
  ];

  if (filters.accountId) conditions.push(eq(transactions.accountId, filters.accountId));
  if (filters.categoryId) conditions.push(eq(transactions.categoryId, filters.categoryId));
  if (filters.needsReview) conditions.push(eq(transactions.needsReview, true));
  if (filters.kind) conditions.push(eq(transactions.kind, filters.kind));
  if (filters.ids) conditions.push(inArray(transactions.id, filters.ids));
  if (filters.transferId) conditions.push(eq(transactions.transferId, filters.transferId));
  if (filters.search) conditions.push(searchCondition(filters.search));
  if (filters.cursor) conditions.push(cursorCondition(filters.cursor));

  return and(...conditions);
};

const pageSize = (filters: ListFilters): number =>
  Math.min(filters.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

const listRows = async (
  db: DbOrTx,
  userId: string,
  filters: ListFilters,
  limit: number
): Promise<ListedRow[]> => {
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
      cursorCreatedAt: sql<string>`${transactions.createdAt}::text`,
      date: transactions.date,
      deletedAt: transactions.deletedAt,
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
      and(eq(peer.transferId, transactions.transferId), sql`${peer.id} <> ${transactions.id}`)
    )
    .leftJoin(peerAccount, eq(peerAccount.id, peer.accountId))
    .where(buildListWhere(userId, filters))
    .orderBy(desc(transactions.date), desc(transactions.createdAt), desc(transactions.id))
    .limit(limit);

  return rows.map(row => ({
    ...row,
    amountMinor: Number(row.amountMinor),
    deletedAt: toIsoTimestamp(row.deletedAt),
  }));
};

const toRow = ({ cursorCreatedAt, ...row }: ListedRow): TransactionRow => row;

export const list = async (
  db: DbOrTx,
  userId: string,
  filters: ListFilters = {}
): Promise<TransactionRow[]> => (await listRows(db, userId, filters, pageSize(filters))).map(toRow);

export const page = async (
  db: Db,
  userId: string,
  filters: ListFilters = {}
): Promise<PageResponse<TransactionRow>> => {
  const limit = pageSize(filters);
  const rows = await listRows(db, userId, filters, limit + 1);
  const items = rows.slice(0, limit);
  const last = items.at(-1);

  const nextCursor =
    rows.length > limit && last
      ? encodeCursor({
          createdAt: last.cursorCreatedAt,
          date: last.date,
          id: last.id,
        })
      : null;

  return { items: items.map(toRow), nextCursor };
};

export const get = async (
  db: DbOrTx,
  userId: string,
  id: string,
  { includeDeleted = false } = {}
): Promise<TransactionRow> => {
  const [row] = await list(db, userId, {
    ids: [id],
    includeDeleted,
    limit: 1,
  });

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
