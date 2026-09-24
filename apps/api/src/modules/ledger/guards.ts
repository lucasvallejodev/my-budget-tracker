import { and, eq, isNull } from 'drizzle-orm';

import { accounts, categories, payees, transactions } from '@/db/schema';
import { isIsoDate } from '@coinkeeper/shared/lib/patterns';

import { notFound, ServiceError } from '../db';
import type { DbOrTx } from '../db';
import type { StandardInput, TransactionRecord } from './types';

export const ownedAccount = async (tx: DbOrTx, userId: string, id: string) => {
  const [account] = await tx
    .select()
    .from(accounts)
    .where(and(eq(accounts.id, id), eq(accounts.userId, userId), isNull(accounts.deletedAt)))
    .for('update');

  if (!account) notFound('Account');
  if (account.archivedAt) throw new ServiceError('This account is archived');

  return account;
};

export const assertCategory = async (tx: DbOrTx, userId: string, id: string): Promise<void> => {
  const [category] = await tx
    .select({ id: categories.id })
    .from(categories)
    .where(
      and(eq(categories.id, id), eq(categories.userId, userId), isNull(categories.archivedAt))
    );

  if (!category) notFound('Category');
};

export const assertPayee = async (tx: DbOrTx, userId: string, id: string): Promise<void> => {
  const [payee] = await tx
    .select({ id: payees.id })
    .from(payees)
    .where(and(eq(payees.id, id), eq(payees.userId, userId)));

  if (!payee) notFound('Payee');
};

export const assertDate = (date: string): void => {
  if (!isIsoDate(date)) throw new ServiceError('Date must be YYYY-MM-DD');
};

export const assertNonZeroAmount = (amountMinor: number): void => {
  if (!Number.isInteger(amountMinor) || amountMinor === 0) {
    throw new ServiceError('Amount must be a non-zero whole number of minor units');
  }
};

export const assertPositiveAmount = (amountMinor: number): void => {
  if (!Number.isInteger(amountMinor) || amountMinor <= 0) {
    throw new ServiceError('Amount must be a positive whole number of minor units');
  }
};

export const ownedTransaction = async (
  tx: DbOrTx,
  userId: string,
  id: string
): Promise<TransactionRecord> => {
  const [row] = await tx
    .select()
    .from(transactions)
    .where(
      and(eq(transactions.id, id), eq(transactions.userId, userId), isNull(transactions.deletedAt))
    )
    .for('update');

  return row ?? notFound('Transaction');
};

export const assertEditable = (
  existing: TransactionRecord,
  input: Partial<StandardInput>
): void => {
  if (existing.kind === 'transfer') {
    throw new ServiceError('Use the transfer editor for transfer legs');
  }

  const touchesLedger = input.amountMinor !== undefined || input.date || input.accountId;

  if (existing.status === 'reconciled' && touchesLedger) {
    throw new ServiceError('Reconciled transactions are locked; unlock them first');
  }

  if (existing.kind !== 'standard' && input.categoryId) {
    throw new ServiceError('Only standard transactions can have a category');
  }
};

export const assertLinkable = (outRow: TransactionRecord, inRow: TransactionRecord): void => {
  if (outRow.kind !== 'standard' || inRow.kind !== 'standard') {
    throw new ServiceError('Only standard transactions can be linked');
  }

  if (outRow.accountId === inRow.accountId) {
    throw new ServiceError('Transfer legs must be in different accounts');
  }

  if (Number(outRow.amountMinor) >= 0 || Number(inRow.amountMinor) <= 0) {
    throw new ServiceError('One leg must be money out and the other money in');
  }
};
