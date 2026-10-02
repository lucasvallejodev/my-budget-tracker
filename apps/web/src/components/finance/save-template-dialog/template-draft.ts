import type { TemplateFormValues } from '@coinkeeper/shared/schema/templates';
import type {
  StandardTransactionValues,
  TransferValues,
} from '@coinkeeper/shared/schema/transaction';

export type TemplateDraft = Omit<TemplateFormValues, 'name'>;

export type TemplateSource = Partial<StandardTransactionValues & TransferValues> & {
  mode?: 'expense' | 'income' | 'transfer';
};

const text = (value?: string): string => value ?? '';

const transferDraft = (source: TemplateSource): TemplateDraft => ({
  accountId: text(source.fromAccountId),
  amount: text(source.amountFrom),
  direction: 'expense',
  kind: 'transfer',
  memo: text(source.memo),
  transferAccountId: text(source.toAccountId),
});

const standardDraft = (source: TemplateSource): TemplateDraft => ({
  accountId: text(source.accountId),
  amount: text(source.amount),
  categoryId: text(source.categoryId),
  direction: (source.mode ?? source.direction) === 'income' ? 'income' : 'expense',
  kind: 'standard',
  memo: text(source.memo),
  payeeId: text(source.payeeId),
});

export const draftFromSource = (source: TemplateSource): TemplateDraft =>
  source.mode === 'transfer' ? transferDraft(source) : standardDraft(source);
