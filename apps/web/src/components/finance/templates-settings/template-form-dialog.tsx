'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Control, useForm, useWatch } from 'react-hook-form';

import { createTemplate, updateTemplate } from '@/api/mutations';
import {
  Dialog,
  DialogContent,
  DialogFormFooter,
  DialogTitle,
  Field,
  Form,
  FormStack,
  saveLabel,
  SegmentedControl,
  TextField,
} from '@/components/ui';
import { templateFormSchema, type TemplateFormValues } from '@coinkeeper/shared/schema/templates';

import { templateAmountText } from '../template-labels';
import {
  AccountField,
  AmountField,
  CategoryField,
  MemoField,
  PayeeField,
} from '../transaction-dialog';
import { useEntityMutation } from '../use-entity-mutation';
import type { TemplateRow } from '../use-finance-data';

type Mode = 'expense' | 'income' | 'transfer';

const ModeOptions = [
  // keep order
  { label: 'Expense', value: 'expense' },
  { label: 'Income', value: 'income' },
  { label: 'Transfer', value: 'transfer' },
];

const EmptyTemplate: TemplateFormValues = {
  accountId: '',
  amount: '',
  categoryId: '',
  direction: 'expense',
  kind: 'standard',
  memo: '',
  name: '',
  payeeId: '',
  transferAccountId: '',
};

const templateDefaults = (template?: TemplateRow): TemplateFormValues => {
  if (!template) return EmptyTemplate;

  return {
    accountId: template.accountId ?? '',
    amount: templateAmountText(template),
    categoryId: template.categoryId ?? '',
    direction: template.direction,
    kind: template.kind,
    memo: template.memo,
    name: template.name,
    payeeId: template.payeeId ?? '',
    transferAccountId: template.transferAccountId ?? '',
  };
};

const saveTemplate = (template: TemplateRow | undefined, values: TemplateFormValues) =>
  template ? updateTemplate(template.id, values) : createTemplate(values);

function TemplateFields({ control, mode }: { control: Control<TemplateFormValues>; mode: Mode }) {
  return (
    <>
      <AccountField
        control={control}
        name="accountId"
        label={mode === 'transfer' ? 'From account' : 'Account'}
        description="Optional. Needed to save an amount."
      />
      {mode === 'transfer' && (
        <AccountField
          control={control}
          name="transferAccountId"
          label="To account"
          description="Optional. Where the money arrives."
        />
      )}
      <AmountField
        control={control}
        name="amount"
        label="Amount"
        description="Optional. Leave it empty to type the amount each time."
      />
      {mode !== 'transfer' && (
        <>
          <PayeeField control={control} onSelect={() => undefined} />
          <CategoryField control={control} kind={mode} />
        </>
      )}
      <MemoField control={control} name="memo" description="Copied onto the transaction." />
    </>
  );
}

export function TemplateFormDialog({
  onClose,
  template,
}: {
  onClose: () => void;
  template?: TemplateRow;
}) {
  const form = useForm<TemplateFormValues>({
    defaultValues: templateDefaults(template),
    resolver: zodResolver(templateFormSchema),
  });

  const [kind, direction] = useWatch({ control: form.control, name: ['kind', 'direction'] });
  const mode: Mode = kind === 'transfer' ? 'transfer' : direction;

  const changeMode = (next: string) => {
    form.setValue('kind', next === 'transfer' ? 'transfer' : 'standard');
    form.setValue('direction', next === 'income' ? 'income' : 'expense');
  };

  const { isPending, mutate } = useEntityMutation({
    errorMessage: 'Could not save the template',
    mutationFn: (values: TemplateFormValues) => saveTemplate(template, values),
    onSuccess: onClose,
    successMessage: template ? 'Template updated' : 'Template saved',
  });

  return (
    <Dialog
      open
      onOpenChange={open => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogTitle>{template ? 'Edit template' : 'New template'}</DialogTitle>
        <Form {...form}>
          <FormStack onSubmit={form.handleSubmit(values => mutate(values))}>
            <TextField
              control={form.control}
              name="name"
              label="Name"
              description="Shown on the template chip in the transaction form."
            />
            <Field as="div">
              Type
              <SegmentedControl
                label="Template type"
                options={ModeOptions}
                value={mode}
                onChange={changeMode}
              />
            </Field>
            <TemplateFields control={form.control} mode={mode} />
            <DialogFormFooter
              isPending={isPending}
              submitLabel={saveLabel(!!template, 'Save template')}
              onCancel={onClose}
            />
          </FormStack>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
