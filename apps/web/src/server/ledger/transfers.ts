import { and, eq, isNull } from 'drizzle-orm';

import { transactions } from '@/db/schema';

import { notFound, ServiceError } from '../db';
import type { Db, DbOrTx } from '../db';
import {
  assertDate,
  assertLinkable,
  assertPositiveAmount,
  ownedAccount,
  ownedTransaction,
} from './guards';
import type { TransactionRecord, TransferInput } from './types';

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

    const legs = await tx
      .insert(transactions)
      .values([
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
      ])
      .returning();

    return { legs, transferId };
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

    return { transferId };
  });
};

export const linkAsTransfer = async (db: Db, userId: string, outId: string, inId: string) => {
  return db.transaction(async tx => {
    const outRow = await ownedTransaction(tx, userId, outId);
    const inRow = await ownedTransaction(tx, userId, inId);

    assertLinkable(outRow, inRow);

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

    return { transferId };
  });
};
