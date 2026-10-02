'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ReactNode, useEffect, useState } from 'react';
import { Control, FieldValues, Path, useForm, UseFormReturn, useWatch } from 'react-hook-form';

import {
  createTransaction,
  createTransfer,
  updateTransaction,
  updateTransfer,
} from '@/api/mutations';
import {
  Dialog,
  DialogContent,
  DialogFormFooter,
  DialogTitle,
  DialogTrigger,
  Field,
  Form,
  FormStack,
  saveLabel,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  Stack,
} from '@/components/ui';
import { useDialogState } from '@/lib/dialog-state';
import { RememberedFields, rememberValue } from '@/lib/form-memory';
import {
  standardTransactionSchema,
  StandardTransactionValues,
  transferSchema,
  TransferValues,
} from '@coinkeeper/shared/schema/transaction';

import { useEntityMutation } from '../use-entity-mutation';
import { TemplateRow, TransactionRow, useAccounts, usePayees } from '../use-finance-data';
import { CategoryOrSplit, useSplitting } from './split-lines';
import { TemplateChips } from './template-chips';
import {
  SaveAsTemplateButton,
  SaveTemplateFromForm,
  standardTemplateRequest,
  TemplateRequest,
  transferTemplateRequest,
  useTemplatePick,
} from './template-request';
import {
  Direction,
  Mode,
  modeOf,
  Preset,
  rememberedStandardPreset,
  rememberedTransferPreset,
  standardDefaults,
  transferDefaults,
} from './transaction-defaults';
import { AccountField, AmountField, DateField, MemoField, PayeeField } from './transaction-fields';

type FormProps<Values> = {
  focusAmount: boolean;
  onDone: () => void;
  preset?: Partial<Values>;
  transaction?: TransactionRow;
};

type TransactionDialogProps = {
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  preset?: Preset;
  transaction?: TransactionRow;
  trigger?: ReactNode;
};

function ModeSelect({
  disabled,
  onChange,
  value,
}: {
  disabled: boolean;
  onChange: (mode: Mode) => void;
  value: Mode;
}) {
  return (
    <Field as="div">
      <label htmlFor="transaction-mode">Type</label>
      <Select value={value} disabled={disabled} onValueChange={mode => onChange(mode as Mode)}>
        <SelectTrigger id="transaction-mode">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Transaction type</SelectLabel>
            <SelectItem value="expense">Expense</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="transfer">Transfer between accounts</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  );
}

function TransactionForm({
  mode,
  pickId,
  ...formProps
}: FormProps<StandardTransactionValues & TransferValues> & { mode: Mode; pickId: string }) {
  const key = `${mode}-${formProps.transaction?.id ?? 'new'}-${pickId}`;

  if (mode === 'transfer') return <TransferForm key={key} {...formProps} />;

  return <StandardForm key={key} direction={mode} {...formProps} />;
}

function useFocusField<Values extends FieldValues>(
  form: UseFormReturn<Values>,
  name: Path<Values>,
  enabled: boolean
) {
  useEffect(() => {
    if (enabled) form.setFocus(name);
  }, [enabled, form, name]);
}

export function TransactionDialog({
  onOpenChange,
  open: controlledOpen,
  preset,
  transaction,
  trigger,
}: TransactionDialogProps) {
  const [localOpen, setLocalOpen] = useState(false);
  const [modeOverride, setModeOverride] = useState<Mode | null>(null);
  const templates = useTemplatePick();
  const open = controlledOpen ?? localOpen;

  const setOpen = (value: boolean) => {
    setLocalOpen(value);

    if (!value) {
      setModeOverride(null);
      templates.clear();
    }

    onOpenChange?.(value);
  };

  const pickTemplate = (template: TemplateRow) => {
    setModeOverride(null);
    templates.pickTemplate(template);
  };

  const activePreset = templates.presetOr(preset);
  const mode = modeOverride ?? modeOf(transaction, activePreset);
  const editing = !!transaction;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogTitle>{editing ? 'Edit transaction' : 'New transaction'}</DialogTitle>
        <Stack gap="medium">
          {!editing && <TemplateChips onPick={pickTemplate} />}
          <ModeSelect value={mode} disabled={editing} onChange={setModeOverride} />
          <TransactionForm
            mode={mode}
            pickId={templates.pickId}
            focusAmount={templates.focusAmount}
            preset={activePreset}
            transaction={transaction}
            onDone={() => setOpen(false)}
          />
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

function StandardFields({
  control,
  direction,
  onPayee,
  split,
}: {
  control: Control<StandardTransactionValues>;
  direction: Direction;
  onPayee: (payeeId: string) => void;
  split: ReturnType<typeof useSplitting>;
}) {
  return (
    <>
      <AccountField
        control={control}
        name="accountId"
        label="Account"
        description={`The account this ${direction} belongs to.`}
      />
      <AmountField
        control={control}
        name="amount"
        label="Amount"
        description="In the account currency. Use a comma or dot for decimals."
      />
      <PayeeField control={control} onSelect={onPayee} />
      <CategoryOrSplit
        control={control}
        direction={direction}
        splitting={split.splitting}
        onToggle={split.toggle}
      />
      <MemoField control={control} name="memo" description="A short note about the transaction." />
      <DateField control={control} name="date" description="When this transaction occurred." />
    </>
  );
}

function StandardForm({
  direction,
  focusAmount,
  onDone,
  preset,
  transaction,
}: FormProps<StandardTransactionValues> & { direction: Direction }) {
  const { data: payees } = usePayees();
  const { data: accounts } = useAccounts();
  const templateRequest = useDialogState<TemplateRequest>();

  const form = useForm<StandardTransactionValues>({
    defaultValues: standardDefaults(
      direction,
      transaction,
      transaction ? preset : { ...rememberedStandardPreset(accounts), ...preset }
    ),
    resolver: zodResolver(standardTransactionSchema),
  });

  useEffect(() => {
    form.setValue('direction', direction);
  }, [direction, form]);

  useFocusField(form, 'amount', focusAmount);

  const split = useSplitting(form, !!transaction?.splits.length);

  const { isPending, mutate } = useEntityMutation({
    errorMessage: 'Could not save the transaction',
    mutationFn: (values: StandardTransactionValues) =>
      transaction
        ? updateTransaction(transaction.id, split.prepare(values))
        : createTransaction(split.prepare(values)),
    onSuccess: () => {
      rememberValue(RememberedFields.standardAccount, form.getValues('accountId'));
      form.reset();
      onDone();
    },
    successMessage: transaction ? 'Transaction updated' : 'Transaction created',
  });

  const requestTemplate = () =>
    templateRequest.open(standardTemplateRequest(form.getValues(), direction, payees));

  const applyPayeeDefault = (payeeId: string) => {
    const payee = payees?.find(candidate => candidate.id === payeeId);

    if (payee?.defaultCategoryId && !form.getValues('categoryId')) {
      form.setValue('categoryId', payee.defaultCategoryId);
    }
  };

  return (
    <Form {...form}>
      <FormStack onSubmit={form.handleSubmit(values => mutate(values))}>
        <StandardFields
          control={form.control}
          direction={direction}
          split={split}
          onPayee={applyPayeeDefault}
        />
        <DialogFormFooter
          isPending={isPending}
          secondaryAction={<SaveAsTemplateButton onClick={requestTemplate} />}
          submitLabel={saveLabel(!!transaction)}
          onCancel={() => form.reset()}
        />
      </FormStack>
      <SaveTemplateFromForm request={templateRequest.value} onClose={templateRequest.close} />
    </Form>
  );
}

function TransferForm({ focusAmount, onDone, preset, transaction }: FormProps<TransferValues>) {
  const { data: accounts } = useAccounts();
  const templateRequest = useDialogState<TemplateRequest>();

  const form = useForm<TransferValues>({
    defaultValues: transferDefaults(
      transaction,
      transaction ? preset : { ...rememberedTransferPreset(accounts), ...preset }
    ),
    resolver: zodResolver(transferSchema),
  });

  useFocusField(form, 'amountFrom', focusAmount);

  const requestTemplate = () => templateRequest.open(transferTemplateRequest(form.getValues()));

  const [fromId, toId] = useWatch({
    control: form.control,
    name: ['fromAccountId', 'toAccountId'],
  });

  const from = accounts?.find(account => account.id === fromId);
  const to = accounts?.find(account => account.id === toId);
  const crossCurrency = !!from && !!to && from.currency !== to.currency;
  const sentLabel = from ? `Amount sent (${from.currency})` : 'Amount sent';

  const { isPending, mutate } = useEntityMutation({
    errorMessage: 'Could not save the transfer',
    mutationFn: (values: TransferValues) =>
      transaction?.transferId
        ? updateTransfer(transaction.transferId, values)
        : createTransfer(values),
    onSuccess: () => {
      rememberValue(RememberedFields.transferFrom, form.getValues('fromAccountId'));
      rememberValue(RememberedFields.transferTo, form.getValues('toAccountId'));
      form.reset();
      onDone();
    },
    successMessage: transaction ? 'Transfer updated' : 'Transfer recorded',
  });

  return (
    <Form {...form}>
      <FormStack onSubmit={form.handleSubmit(values => mutate(values))}>
        <AccountField
          control={form.control}
          name="fromAccountId"
          label="From account"
          description="Money leaves this account."
        />
        <AccountField
          control={form.control}
          name="toAccountId"
          label="To account"
          description="Money arrives here. Paying a credit card is a transfer to the card."
        />
        <AmountField
          control={form.control}
          name="amountFrom"
          label={sentLabel}
          description="Positive amount in the source account currency."
        />
        {crossCurrency && (
          <AmountField
            control={form.control}
            name="amountTo"
            label={`Amount received (${to?.currency})`}
            description="Required for a cross-currency transfer; the ratio is the realised rate."
          />
        )}
        <MemoField control={form.control} name="memo" description="Shown on both legs." />
        <DateField control={form.control} name="date" description="When the money moved." />
        <DialogFormFooter
          isPending={isPending}
          secondaryAction={<SaveAsTemplateButton onClick={requestTemplate} />}
          submitLabel={saveLabel(!!transaction, 'Record transfer')}
          onCancel={() => form.reset()}
        />
      </FormStack>
      <SaveTemplateFromForm request={templateRequest.value} onClose={templateRequest.close} />
    </Form>
  );
}
