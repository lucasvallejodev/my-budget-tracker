import { and, eq, isNotNull, isNull } from 'drizzle-orm';

import { accounts, transactions } from '@/db/schema';

import { conflict, notFound, ServiceError } from '../db';
import type { Db, DbOrTx } from '../db';
import {
  assertDate,
  assertLinkable,
  assertPositiveAmount,
  ownedAccount,
  ownedTransaction,
} from './guards';
import { list } from './queries';
import type { TransactionRecord, Transfer, TransferInput, TransferPatch } from './types';

type Account = Awaited<ReturnType<typeof ownedAccount>>;

type TransferLegs = {
  inLeg: TransactionRecord;
  outLeg: TransactionRecord;
};

type TransferAmounts = {
  amountFrom: number;
  amountTo: number;
};

const TRANSFER_LEG_COUNT = 2;

const legFirst = (left: { amountMinor: number }, right: { amountMinor: number }): number =>
  left.amountMinor - right.amountMinor;

export const getTransfer = async (
  db: DbOrTx,
  userId: string,
  transferId: string,
  { deleted = false } = {}
): Promise<Transfer> => {
  const legs = await list(db, userId, { deleted, transferId });

  if (legs.length !== TRANSFER_LEG_COUNT) notFound('Transfer');

  return { legs: legs.toSorted(legFirst), transferId };
};

const transferScope = (userId: string, transferId: string) =>
  and(eq(transactions.transferId, transferId), eq(transactions.userId, userId));

const assertDifferentAccounts = (fromId: string, toId: string): void => {
  if (fromId === toId) throw new ServiceError('Choose two different accounts');
};

const receivedAmount = (from: Account, to: Account, input: TransferInput): number => {
  if (from.currency === to.currency) return input.amountToMinor ?? input.amountFromMinor;

  const amountTo = input.amountToMinor;

  if (!amountTo || !Number.isInteger(amountTo) || amountTo <= 0) {
    throw new ServiceError(
      `Enter the amount received in ${to.currency} for this cross-currency transfer`
    );
  }

  return amountTo;
};

const resolveTransferAmounts = (
  from: Account,
  to: Account,
  legs: TransferLegs,
  input: Partial<TransferInput>
): TransferAmounts => {
  const amountFrom = input.amountFromMinor ?? -Number(legs.outLeg.amountMinor);
  const keepsReceivingAccount = to.id === legs.inLeg.accountId;
  const previousTo = keepsReceivingAccount ? Number(legs.inLeg.amountMinor) : undefined;
  const amountTo = from.currency === to.currency ? amountFrom : (input.amountToMinor ?? previousTo);

  if (!amountTo || amountTo <= 0 || amountFrom <= 0) {
    throw new ServiceError('Transfer amounts must be positive');
  }

  return { amountFrom, amountTo };
};

const lockedTransferLegs = async (
  tx: DbOrTx,
  userId: string,
  transferId: string
): Promise<TransferLegs> => {
  const legs = await tx
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.transferId, transferId),
        eq(transactions.userId, userId),
        isNull(transactions.deletedAt)
      )
    )
    .for('update');

  if (legs.length !== TRANSFER_LEG_COUNT) notFound('Transfer');

  return {
    inLeg: legs.find(leg => leg.amountMinor > 0)!,
    outLeg: legs.find(leg => leg.amountMinor < 0)!,
  };
};

export const createTransfer = async (db: Db, userId: string, input: TransferInput) => {
  assertDate(input.date);
  assertDifferentAccounts(input.fromAccountId, input.toAccountId);
  assertPositiveAmount(input.amountFromMinor);

  return db.transaction(async tx => {
    const from = await ownedAccount(tx, userId, input.fromAccountId);
    const to = await ownedAccount(tx, userId, input.toAccountId);
    const amountTo = receivedAmount(from, to, input);
    const transferId = crypto.randomUUID();

    const shared = {
      date: input.date,
      kind: 'transfer' as const,
      memo: input.memo?.trim() ?? '',
      status: input.status ?? 'cleared',
      transferId,
      userId,
    };

    await tx.insert(transactions).values([
      {
        ...shared,
        accountId: from.id,
        amountMinor: -input.amountFromMinor,
        currency: from.currency,
      },
      {
        ...shared,
        accountId: to.id,
        amountMinor: amountTo,
        currency: to.currency,
      },
    ]);

    return getTransfer(tx, userId, transferId);
  });
};

export const updateTransfer = async (
  db: Db,
  userId: string,
  transferId: string,
  input: Partial<TransferInput>
) => {
  if (input.date) assertDate(input.date);

  return db.transaction(async tx => {
    const legs = await lockedTransferLegs(tx, userId, transferId);
    const from = await ownedAccount(tx, userId, input.fromAccountId ?? legs.outLeg.accountId);
    const to = await ownedAccount(tx, userId, input.toAccountId ?? legs.inLeg.accountId);

    assertDifferentAccounts(from.id, to.id);

    const { amountFrom, amountTo } = resolveTransferAmounts(from, to, legs, input);

    const shared = {
      date: input.date ?? legs.outLeg.date,
      memo: input.memo?.trim() ?? legs.outLeg.memo,
      status: input.status ?? legs.outLeg.status,
    };

    await tx
      .update(transactions)
      .set({
        ...shared,
        accountId: from.id,
        amountMinor: -amountFrom,
        currency: from.currency,
      })
      .where(eq(transactions.id, legs.outLeg.id));
    await tx
      .update(transactions)
      .set({
        ...shared,
        accountId: to.id,
        amountMinor: amountTo,
        currency: to.currency,
      })
      .where(eq(transactions.id, legs.inLeg.id));

    return getTransfer(tx, userId, transferId);
  });
};

export const patchTransfer = async (
  db: Db,
  userId: string,
  transferId: string,
  input: TransferPatch
): Promise<Transfer> =>
  db.transaction(async tx => {
    await lockedTransferLegs(tx, userId, transferId);

    const patch = {
      ...(input.memo === undefined ? {} : { memo: input.memo.trim() }),
      ...(input.status ? { status: input.status } : {}),
    };

    if (Object.keys(patch).length) {
      await tx.update(transactions).set(patch).where(transferScope(userId, transferId));
    }

    return getTransfer(tx, userId, transferId);
  });

export const removeTransfer = async (db: Db, userId: string, transferId: string): Promise<void> => {
  await db.transaction(async tx => {
    await lockedTransferLegs(tx, userId, transferId);
    await tx
      .update(transactions)
      .set({ deletedAt: new Date() })
      .where(and(transferScope(userId, transferId), isNull(transactions.deletedAt)));
  });
};

export const restoreTransfer = async (
  db: Db,
  userId: string,
  transferId: string
): Promise<Transfer> =>
  db.transaction(async tx => {
    const legs = await tx
      .select({ accountDeletedAt: accounts.deletedAt, id: transactions.id })
      .from(transactions)
      .innerJoin(accounts, eq(accounts.id, transactions.accountId))
      .where(and(transferScope(userId, transferId), isNotNull(transactions.deletedAt)));

    if (legs.length !== TRANSFER_LEG_COUNT) notFound('Deleted transfer');

    if (legs.some(leg => leg.accountDeletedAt)) {
      conflict('Restore the accounts of this transfer first');
    }

    await tx.update(transactions).set({ deletedAt: null }).where(transferScope(userId, transferId));

    return getTransfer(tx, userId, transferId);
  });

export const linkAsTransfer = async (db: Db, userId: string, outId: string, inId: string) => {
  return db.transaction(async tx => {
    const outRow = await ownedTransaction(tx, userId, outId);
    const inRow = await ownedTransaction(tx, userId, inId);

    assertLinkable(outRow, inRow);

    if (outRow.currency === inRow.currency && -outRow.amountMinor !== inRow.amountMinor) {
      throw new ServiceError('Both legs of a same-currency transfer must have the same amount');
    }

    const transferId = crypto.randomUUID();

    for (const legId of [outId, inId]) {
      await tx
        .update(transactions)
        .set({
          categoryId: null,
          kind: 'transfer',
          needsReview: false,
          payeeId: null,
          transferId,
        })
        .where(eq(transactions.id, legId));
    }

    return getTransfer(tx, userId, transferId);
  });
};
