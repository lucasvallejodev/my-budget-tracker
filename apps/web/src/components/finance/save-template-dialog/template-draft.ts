import type { TemplateFormValues } from '@coinkeeper/shared/schema/templates';
import type {
  StandardTransactionValues,
  TransferValues,
} from '@coinkeeper/shared/schema/transaction';

export type TemplateDraft = Omit<TemplateFormValues, 'name'>;

export type TemplateSource = Partial<StandardTransactionValues & TransferValues> & {
  mode?: 'expense' | 'income' | 'transfer';
};

export const draftFromSource = (source: TemplateSource): TemplateDraft => {
  if (source.mode === 'transfer') {
    return {
      accountId: source.fromAccountId ?? '',
      amount: source.amountFrom ?? '',
      direction: 'expense',
      kind: 'transfer',
      memo: source.memo ?? '',
      transferAccountId: source.toAccountId ?? '',
    };
  }

  return {
    accountId: source.accountId ?? '',
    amount: source.amount ?? '',
    categoryId: source.categoryId ?? '',
    direction: source.mode ?? source.direction ?? 'expense',
    kind: 'standard',
    memo: source.memo ?? '',
    payeeId: source.payeeId ?? '',
  };
};
