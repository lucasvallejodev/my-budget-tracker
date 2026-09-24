'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { ReactNode, useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

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
import { minorToDecimalString } from '@coinkeeper/shared/lib/money';
import {
  standardTransactionSchema,
  StandardTransactionValues,
  transferSchema,
  TransferValues,
} from '@coinkeeper/shared/schema/transaction';

import { useEntityMutation } from '../use-entity-mutation';
import { TransactionRow, useAccounts, usePayees } from '../use-finance-data';
import {
  AccountField,
  AmountField,
  CategoryField,
  DateField,
  MemoField,
  PayeeField,
} from './transaction-fields';

type Mode = 'expense' | 'income' | 'transfer';
type Direction = Exclude<Mode, 'transfer'>;
type Preset = Partial<StandardTransactionValues & TransferValues> & { mode?: Mode };

type TransactionDialogProps = {
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  preset?: Preset;
  transaction?: TransactionRow;
  trigger?: ReactNode;
};

const today = () => format(new Date(), 'yyyy-MM-dd');

const modeOf = (transaction?: TransactionRow, preset?: Preset): Mode => {
  if (!transaction) return preset?.mode ?? 'expense';
  if (transaction.kind === 'transfer') return 'transfer';

  return transaction.amountMinor < 0 ? 'expense' : 'income';
};

const standardDefaults = (
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

const transferDefaults = (
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

export function TransactionDialog({
  onOpenChange,
  open: controlledOpen,
  preset,
  transaction,
  trigger,
}: TransactionDialogProps) {
  const [localOpen, setLocalOpen] = useState(false);
  const [modeOverride, setModeOverride] = useState<Mode | null>(null);
  const open = controlledOpen ?? localOpen;

  const setOpen = (value: boolean) => {
    setLocalOpen(value);
    if (!value) setModeOverride(null);
    onOpenChange?.(value);
  };

  const mode = modeOverride ?? modeOf(transaction, preset);
  const editing = !!transaction;
  const formKey = `${mode}-${transaction?.id ?? 'new'}`;
  const close = () => setOpen(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogTitle>{editing ? 'Edit transaction' : 'New transaction'}</DialogTitle>
        <Stack gap="medium">
          <ModeSelect value={mode} disabled={editing} onChange={setModeOverride} />
          {mode === 'transfer' ? (
            <TransferForm key={formKey} transaction={transaction} preset={preset} onDone={close} />
          ) : (
            <StandardForm
              key={formKey}
              direction={mode}
              transaction={transaction}
              preset={preset}
              onDone={close}
            />
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

function StandardForm({
  direction,
  onDone,
  preset,
  transaction,
}: {
  direction: Direction;
  onDone: () => void;
  preset?: Partial<StandardTransactionValues>;
  transaction?: TransactionRow;
}) {
  const { data: payees } = usePayees();

  const form = useForm<StandardTransactionValues>({
    defaultValues: standardDefaults(direction, transaction, preset),
    resolver: zodResolver(standardTransactionSchema),
  });

  useEffect(() => {
    form.setValue('direction', direction);
  }, [direction, form]);

  const { isPending, mutate } = useEntityMutation({
    errorMessage: 'Could not save the transaction',
    mutationFn: (values: StandardTransactionValues) =>
      transaction ? updateTransaction(transaction.id, values) : createTransaction(values),
    onSuccess: () => {
      form.reset();
      onDone();
    },
    successMessage: transaction ? 'Transaction updated' : 'Transaction created',
  });

  const applyPayeeDefault = (payeeId: string) => {
    const payee = payees?.find(candidate => candidate.id === payeeId);

    if (payee?.defaultCategoryId && !form.getValues('categoryId')) {
      form.setValue('categoryId', payee.defaultCategoryId);
    }
  };

  return (
    <Form {...form}>
      <FormStack onSubmit={form.handleSubmit(values => mutate(values))}>
        <AccountField
          control={form.control}
          name="accountId"
          label="Account"
          description={`The account this ${direction} belongs to.`}
        />
        <AmountField
          control={form.control}
          name="amount"
          label="Amount"
          description="In the account currency. Use a comma or dot for decimals."
        />
        <PayeeField control={form.control} onSelect={applyPayeeDefault} />
        <CategoryField control={form.control} kind={direction} />
        <MemoField
          control={form.control}
          name="memo"
          description="A short note about the transaction."
        />
        <DateField
          control={form.control}
          name="date"
          description="When this transaction occurred."
        />
        <DialogFormFooter
          isPending={isPending}
          submitLabel={saveLabel(!!transaction)}
          onCancel={() => form.reset()}
        />
      </FormStack>
    </Form>
  );
}

function TransferForm({
  onDone,
  preset,
  transaction,
}: {
  onDone: () => void;
  preset?: Partial<TransferValues>;
  transaction?: TransactionRow;
}) {
  const { data: accounts } = useAccounts();

  const form = useForm<TransferValues>({
    defaultValues: transferDefaults(transaction, preset),
    resolver: zodResolver(transferSchema),
  });

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
          submitLabel={saveLabel(!!transaction, 'Record transfer')}
          onCancel={() => form.reset()}
        />
      </FormStack>
    </Form>
  );
}
