import { localIsoDate } from '@coinkeeper/shared/lib/date-helpers';
import type { TemplateRow } from '@coinkeeper/shared/schema/templates';

import { templateAmountText } from '../template-labels';
import type { Preset } from './transaction-defaults';

const usedTime = (template: TemplateRow): number =>
  template.lastUsedAt ? Date.parse(template.lastUsedAt) : 0;

export const chipOrder = (templates: TemplateRow[]): TemplateRow[] =>
  templates.toSorted(
    (left, right) => usedTime(right) - usedTime(left) || left.sortOrder - right.sortOrder
  );

export const templatePreset = (template: TemplateRow): Preset => {
  const shared = {
    date: localIsoDate(new Date()),
    memo: template.memo,
    status: 'cleared' as const,
    templateId: template.id,
  };

  if (template.kind === 'transfer') {
    return {
      ...shared,
      amountFrom: templateAmountText(template),
      fromAccountId: template.accountId ?? '',
      mode: 'transfer',
      toAccountId: template.transferAccountId ?? '',
    };
  }

  return {
    ...shared,
    accountId: template.accountId ?? '',
    amount: templateAmountText(template),
    categoryId: template.categoryId ?? '',
    mode: template.direction,
    payeeId: template.payeeId ?? '',
  };
};

export const asksForAmount = (template: TemplateRow): boolean => template.amountMinor === null;
