import { HttpStatus } from '@/constants/http';
import { ServiceError } from '@/modules/db';
import type { StandardInput, TransferInput } from '@/modules/ledger/service';
import type { Services } from '@/modules/services';
import { parseAmountInput } from '@coinkeeper/shared/lib/money';
import type { TransactionPatchValues, TransferValues } from '@coinkeeper/shared/schema/transaction';
import type { StandardTransactionValues } from '@coinkeeper/shared/schema/transaction';

export const parseAmount = (text: string, currency: string): number => {
  try {
    return parseAmountInput(text, currency);
  } catch (error) {
    throw new ServiceError(
      error instanceof Error ? error.message : 'Amount is not valid',
      HttpStatus.badRequest
    );
  }
};

export const parseMagnitude = (text: string, currency: string): number => {
  const magnitude = Math.abs(parseAmount(text, currency));

  if (magnitude === 0) throw new ServiceError('Amount must not be zero', HttpStatus.badRequest);

  return magnitude;
};

const optionalReference = (value: string | undefined): string | null | undefined =>
  value === undefined ? undefined : value || null;

export const toStandardInput = async (
  services: Services,
  userId: string,
  data: StandardTransactionValues
): Promise<StandardInput> => {
  const account = await services.accounts.owned(userId, data.accountId);
  const magnitude = parseMagnitude(data.amount, account.currency);

  return {
    accountId: data.accountId,
    amountMinor: data.direction === 'expense' ? -magnitude : magnitude,
    categoryId: data.categoryId || null,
    date: data.date,
    excluded: data.excluded,
    memo: data.memo,
    payeeId: data.payeeId || null,
    status: data.status,
  };
};

const signedAmount = async (
  services: Services,
  userId: string,
  id: string,
  data: TransactionPatchValues
): Promise<number | undefined> => {
  if (data.amount === undefined) return undefined;

  const current = await services.ledger.get(userId, id);
  const accountId = data.accountId ?? current.accountId;
  const account = await services.accounts.owned(userId, accountId);
  const magnitude = parseMagnitude(data.amount, account.currency);
  const direction = data.direction ?? (current.amountMinor < 0 ? 'expense' : 'income');

  return direction === 'expense' ? -magnitude : magnitude;
};

export const toStandardPatch = async (
  services: Services,
  userId: string,
  id: string,
  data: TransactionPatchValues
): Promise<Partial<StandardInput>> => ({
  accountId: data.accountId,
  amountMinor: await signedAmount(services, userId, id, data),
  categoryId: optionalReference(data.categoryId),
  date: data.date,
  excluded: data.excluded,
  memo: data.memo,
  needsReview: data.needsReview,
  payeeId: optionalReference(data.payeeId),
  status: data.status,
});

export const toTransferInput = async (
  services: Services,
  userId: string,
  data: TransferValues
): Promise<TransferInput> => {
  const from = await services.accounts.owned(userId, data.fromAccountId);
  const to = await services.accounts.owned(userId, data.toAccountId);

  return {
    amountFromMinor: parseMagnitude(data.amountFrom, from.currency),
    amountToMinor: data.amountTo?.trim() ? parseMagnitude(data.amountTo, to.currency) : undefined,
    date: data.date,
    fromAccountId: data.fromAccountId,
    memo: data.memo,
    status: data.status,
    toAccountId: data.toAccountId,
  };
};
