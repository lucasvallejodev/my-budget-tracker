import { HttpStatus } from '@/constants/http';
import { ServiceError } from '@/modules/db';
import type { SplitInput, StandardInput, TransferInput } from '@/modules/ledger/service';
import type { SeriesInput } from '@/modules/recurring/service';
import type { Services } from '@/modules/services';
import type { TemplateInput } from '@/modules/templates/service';
import { parseAmountInput } from '@coinkeeper/shared/lib/money';
import type { RecurringFormValues } from '@coinkeeper/shared/schema/recurring';
import type { TemplateFormValues } from '@coinkeeper/shared/schema/templates';
import type { TransactionPatchValues, TransferValues } from '@coinkeeper/shared/schema/transaction';
import type {
  SplitLineValues,
  StandardTransactionValues,
} from '@coinkeeper/shared/schema/transaction';

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

type Direction = StandardTransactionValues['direction'];

const signed = (magnitude: number, direction: Direction): number =>
  direction === 'expense' ? -magnitude : magnitude;

const toSplitInputs = (
  lines: SplitLineValues[] | undefined,
  currency: string,
  direction: Direction
): SplitInput[] | undefined =>
  lines?.map(line => ({
    amountMinor: signed(parseMagnitude(line.amount, currency), direction),
    categoryId: line.categoryId,
    memo: line.memo ?? '',
  }));

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
    amountMinor: signed(magnitude, data.direction),
    categoryId: data.categoryId || null,
    date: data.date,
    excluded: data.excluded,
    memo: data.memo,
    payeeId: data.payeeId || null,
    recurring: data.recurring,
    splits: toSplitInputs(data.splits, account.currency, data.direction),
    status: data.status,
    templateId: data.templateId,
  };
};

type PatchMoney = Partial<Pick<StandardInput, 'amountMinor' | 'splits'>>;

const patchMoney = async (
  services: Services,
  userId: string,
  id: string,
  data: TransactionPatchValues
): Promise<PatchMoney> => {
  if (data.amount === undefined && data.splits === undefined) return {};

  const current = await services.ledger.get(userId, id);
  const account = await services.accounts.owned(userId, data.accountId ?? current.accountId);
  const direction = data.direction ?? (current.amountMinor < 0 ? 'expense' : 'income');

  return {
    amountMinor:
      data.amount === undefined
        ? undefined
        : signed(parseMagnitude(data.amount, account.currency), direction),
    splits: toSplitInputs(data.splits, account.currency, direction),
  };
};

export const toStandardPatch = async (
  services: Services,
  userId: string,
  id: string,
  data: TransactionPatchValues
): Promise<Partial<StandardInput>> => ({
  accountId: data.accountId,
  categoryId: optionalReference(data.categoryId),
  date: data.date,
  excluded: data.excluded,
  memo: data.memo,
  needsReview: data.needsReview,
  payeeId: optionalReference(data.payeeId),
  status: data.status,
  ...(await patchMoney(services, userId, id, data)),
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
    templateId: data.templateId,
    toAccountId: data.toAccountId,
  };
};

const templateAmount = async (
  services: Services,
  userId: string,
  data: TemplateFormValues
): Promise<null | number> => {
  if (!data.amount?.trim()) return null;
  if (!data.accountId) throw new ServiceError('Choose an account to save an amount');

  const account = await services.accounts.owned(userId, data.accountId);
  const magnitude = parseMagnitude(data.amount, account.currency);

  return data.kind === 'standard' && data.direction === 'expense' ? -magnitude : magnitude;
};

export const toTemplateInput = async (
  services: Services,
  userId: string,
  data: TemplateFormValues
): Promise<TemplateInput> => ({
  accountId: data.accountId || null,
  amountMinor: await templateAmount(services, userId, data),
  categoryId: data.categoryId || null,
  kind: data.kind,
  memo: data.memo ?? '',
  name: data.name,
  payeeId: data.payeeId || null,
  transferAccountId: data.transferAccountId || null,
});

export const toSeriesInput = async (
  services: Services,
  userId: string,
  data: RecurringFormValues
): Promise<SeriesInput> => {
  const account = await services.accounts.owned(userId, data.accountId);
  const magnitude = parseMagnitude(data.amount, account.currency);

  return {
    accountId: data.accountId,
    amountMinor: signed(magnitude, data.kind === 'income' ? 'income' : 'expense'),
    anchorDate: data.anchorDate,
    cadence: data.cadence,
    categoryId: data.categoryId || null,
    endDate: data.endDate || null,
    interval: data.interval,
    kind: data.kind,
    matchWindowDays: data.matchWindowDays,
    name: data.name,
    payeeId: data.payeeId || null,
    recordMode: data.recordMode,
    source: data.source,
    status: data.status,
  };
};
