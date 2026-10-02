'use client';

import { useState } from 'react';

import { Button } from '@/components/ui';
import type {
  StandardTransactionValues,
  TransferValues,
} from '@coinkeeper/shared/schema/transaction';

import { draftFromSource, SaveTemplateDialog, TemplateDraft } from '../save-template-dialog';
import type { TemplateRow } from '../use-finance-data';
import { asksForAmount, templatePreset } from './template-preset';
import type { Direction, Preset } from './transaction-defaults';

type TemplatePick = {
  askAmount: boolean;
  id: string;
  preset: Preset;
};

export type TemplateRequest = {
  draft: TemplateDraft;
  suggestedName: string;
};

export function SaveAsTemplateButton({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" variant="ghost" onClick={onClick}>
      Save as template
    </Button>
  );
}

export function SaveTemplateFromForm({
  onClose,
  request,
}: {
  onClose: () => void;
  request: TemplateRequest | null;
}) {
  if (!request) return null;

  return (
    <SaveTemplateDialog
      open
      draft={request.draft}
      suggestedName={request.suggestedName}
      onOpenChange={open => {
        if (!open) onClose();
      }}
    />
  );
}

export function useTemplatePick() {
  const [pick, setPick] = useState<TemplatePick | null>(null);

  const pickTemplate = (template: TemplateRow) =>
    setPick({
      askAmount: asksForAmount(template),
      id: template.id,
      preset: templatePreset(template),
    });

  return {
    clear: () => setPick(null),
    focusAmount: !!pick?.askAmount,
    pickId: pick?.id ?? 'blank',
    pickTemplate,
    presetOr: (fallback?: Preset) => pick?.preset ?? fallback,
  };
}

export const standardTemplateRequest = (
  values: StandardTransactionValues,
  direction: Direction,
  payees?: { id: string; name: string }[]
): TemplateRequest => ({
  draft: draftFromSource({ ...values, mode: direction }),
  suggestedName: payees?.find(payee => payee.id === values.payeeId)?.name ?? values.memo ?? '',
});

export const transferTemplateRequest = (values: TransferValues): TemplateRequest => ({
  draft: draftFromSource({ ...values, mode: 'transfer' }),
  suggestedName: values.memo ?? '',
});
