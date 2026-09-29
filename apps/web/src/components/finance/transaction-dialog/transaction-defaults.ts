import { RememberedFields, rememberedValue } from '@/lib/form-memory';
import { localIsoDate } from '@coinkeeper/shared/lib/date-helpers';
import { minorToDecimalString } from '@coinkeeper/shared/lib/money';
import type {
  StandardTransactionValues,
  TransferValues,
} from '@coinkeeper/shared/schema/transaction';

import type { TransactionRow } from '../use-finance-data';

export type Mode = 'expense' | 'income' | 'transfer';
export type Direction = Exclude<Mode, 'transfer'>;
export type Preset = Partial<StandardTransactionValues & TransferValues> & { mode?: Mode };

const today = () => localIsoDate(new Date());

export const modeOf = (transaction?: TransactionRow, preset?: Preset): Mode => {
  if (!transaction) return preset?.mode ?? 'expense';
  if (transaction.kind === 'transfer') return 'transfer';

  return transaction.amountMinor < 0 ? 'expense' : 'income';
};

export const standardDefaults = (
  direction: Direction,
  transaction?: TransactionRow,
  preset?: Partial<StandardTransactionValues>
): StandardTransactionValues => {
  if (!transaction) {
    return {
      accountId: '',
      amount: '',
      categoryId: '',
      date: today(),
      direction,
      excluded: false,
      memo: '',
      payeeId: '',
      status: 'cleared',
      ...preset,
    };
  }

  return {
    accountId: transaction.accountId,
    amount: minorToDecimalString(Math.abs(transaction.amountMinor), transaction.currency),
    categoryId: transaction.categoryId ?? '',
    date: transaction.date,
    direction,
    excluded: transaction.excluded,
    memo: transaction.memo,
    payeeId: transaction.payeeId ?? '',
    status: transaction.status,
  };
};

export const transferDefaults = (
  transaction?: TransactionRow,
  preset?: Partial<TransferValues>
): TransferValues => {
  if (!transaction) {
    return {
      amountFrom: '',
      amountTo: '',
      date: today(),
      fromAccountId: '',
      memo: '',
      status: 'cleared',
      toAccountId: '',
      ...preset,
    };
  }

  const outLeg = transaction.amountMinor < 0;
  const counterpart = transaction.counterpartAccountId ?? '';
  const amount = minorToDecimalString(Math.abs(transaction.amountMinor), transaction.currency);

  return {
    amountFrom: outLeg ? amount : '',
    amountTo: outLeg ? '' : amount,
    date: transaction.date,
    fromAccountId: outLeg ? transaction.accountId : counterpart,
    memo: transaction.memo,
    status: transaction.status,
    toAccountId: outLeg ? counterpart : transaction.accountId,
  };
};

export const knownAccountId = (id: string, accounts?: { id: string }[]): string =>
  accounts?.some(account => account.id === id) ? id : '';

export const rememberedStandardPreset = (
  accounts?: { id: string }[]
): Partial<StandardTransactionValues> => ({
  accountId: knownAccountId(rememberedValue(RememberedFields.standardAccount), accounts),
});

export const rememberedTransferPreset = (accounts?: { id: string }[]): Partial<TransferValues> => ({
  fromAccountId: knownAccountId(rememberedValue(RememberedFields.transferFrom), accounts),
  toAccountId: knownAccountId(rememberedValue(RememberedFields.transferTo), accounts),
});

export const duplicatePreset = (transaction: TransactionRow): Preset => {
  const mode = modeOf(transaction);
  const fresh = { date: today(), status: 'cleared' as const };

  if (mode === 'transfer') {
    return {
      ...transferDefaults(transaction),
      ...fresh,
      mode,
    };
  }

  return {
    ...standardDefaults(mode, transaction),
    ...fresh,
    mode,
  };
};
