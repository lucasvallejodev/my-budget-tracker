import { formatMoney, minorToDecimalString } from '@coinkeeper/shared/lib/money';
import type { TemplateRow, TemplateUnavailableReason } from '@coinkeeper/shared/schema/templates';

export const UnavailableLabels: Record<TemplateUnavailableReason, string> = {
  account_archived: 'Account archived',
  category_archived: 'Category archived',
  transfer_account_archived: 'Destination archived',
};

export const templateAmountText = (template: TemplateRow): string =>
  template.amountMinor !== null && template.currency
    ? minorToDecimalString(Math.abs(template.amountMinor), template.currency)
    : '';

const KindLabels = {
  expense: 'Expense',
  income: 'Income',
  transfer: 'Transfer',
} as const;

const kindLabel = (template: TemplateRow): string =>
  template.kind === 'transfer' ? KindLabels.transfer : KindLabels[template.direction];

const amountLabel = (template: TemplateRow): string =>
  template.amountMinor !== null && template.currency
    ? formatMoney(Math.abs(template.amountMinor), template.currency)
    : 'amount asked each time';

const accountLabel = (template: TemplateRow, accountNames: Map<string, string>): string => {
  const from = template.accountId ? accountNames.get(template.accountId) : undefined;
  const to = template.transferAccountId ? accountNames.get(template.transferAccountId) : undefined;

  if (template.kind === 'transfer') return `${from ?? 'Any account'} → ${to ?? 'any account'}`;

  return from ?? 'Any account';
};

export const describeTemplate = (
  template: TemplateRow,
  accountNames: Map<string, string>
): string =>
  [kindLabel(template), accountLabel(template, accountNames), amountLabel(template)].join(' · ');
