'use client';
import s from '@/components/forms.module.scss';

import { ReactNode, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from '@/components/primitives/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/primitives/form';
import { Input } from '@/components/primitives/input';
import { Button } from '@/components/primitives/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/primitives/popover';
import { Calendar } from '@/components/primitives/calendar';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/primitives/select';
import CategoryPicker from '@/components/category-picker';
import AccountPicker from './account-picker';
import PayeePicker from './payee-picker';
import {
  StandardTransactionValues,
  standardTransactionSchema,
  TransferValues,
  transferSchema,
} from '@/schema/transaction';
import { minorToDecimalString } from '@/lib/money';
import {
  createTransactionAction,
  createTransferAction,
  updateTransactionAction,
  updateTransferAction,
} from '../actions';
import {
  FINANCE_KEYS,
  TransactionRow,
  useAccounts,
  usePayees,
} from '@/components/finance/use-finance-data';

type Mode = 'expense' | 'income' | 'transfer';

type TransactionDialogProps = {
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Existing row to edit (a transfer leg edits the whole transfer). */
  transaction?: TransactionRow;
  /** Preset values for new entries (e.g. "Pay card" from an account page). */
  preset?: Partial<StandardTransactionValues & TransferValues> & { mode?: Mode };
};

const today = () => format(new Date(), 'yyyy-MM-dd');

function useInvalidate() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all(FINANCE_KEYS.map(key => queryClient.invalidateQueries({ queryKey: [key] })));
}

export default function TransactionDialog({
  trigger,
  open: controlledOpen,
  onOpenChange,
  transaction,
  preset,
}: TransactionDialogProps) {
  const [localOpen, setLocalOpen] = useState(false);
  const [modeOverride, setModeOverride] = useState<Mode | null>(null);
  const open = controlledOpen ?? localOpen;
  const setOpen = (value: boolean) => {
    setLocalOpen(value);
    if (!value) setModeOverride(null);
    onOpenChange?.(value);
  };
  const initialMode: Mode = transaction
    ? transaction.kind === 'transfer'
      ? 'transfer'
      : transaction.amountMinor < 0
        ? 'expense'
        : 'income'
    : (preset?.mode ?? 'expense');
  // The user's choice only lives while the dialog is open; closing it returns to the initial mode.
  const mode = modeOverride ?? initialMode;
  const setMode = (value: Mode) => setModeOverride(value);
  const editing = !!transaction;
  const editingTransfer = editing && transaction.kind === 'transfer';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogTitle>{editing ? 'Edit transaction' : 'New transaction'}</DialogTitle>
        <div className={s.form}>
          <div className={s.field}>
            <label className={s.muted} htmlFor="transaction-mode">
              Type
            </label>
            <Select value={mode} disabled={editing} onValueChange={value => setMode(value as Mode)}>
              <SelectTrigger id="transaction-mode" className={s.full}>
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
          </div>
          {mode === 'transfer' || editingTransfer ? (
            <TransferForm
              key={`transfer-${transaction?.id ?? 'new'}`}
              transaction={transaction}
              preset={preset}
              onDone={() => setOpen(false)}
            />
          ) : (
            <StandardForm
              key={`${mode}-${transaction?.id ?? 'new'}`}
              direction={mode}
              transaction={transaction}
              preset={preset}
              onDone={() => setOpen(false)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DateField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const selected = value ? parseISO(value) : undefined;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <FormControl>
          <Button type="button" variant="outline" className={s.dateButton}>
            {selected ? format(selected, 'PPP') : 'Select a date'}
            <CalendarIcon className={s.pickerIcon} />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className={s.datePopover}>
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={date => {
            if (date) onChange(format(date, 'yyyy-MM-dd'));
            setOpen(false);
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}

function StandardForm({
  direction,
  transaction,
  preset,
  onDone,
}: {
  direction: 'expense' | 'income';
  transaction?: TransactionRow;
  preset?: Partial<StandardTransactionValues>;
  onDone: () => void;
}) {
  const invalidate = useInvalidate();
  const { data: payees } = usePayees();
  const form = useForm<StandardTransactionValues>({
    resolver: zodResolver(standardTransactionSchema),
    defaultValues: {
      direction,
      accountId: transaction?.accountId ?? preset?.accountId ?? '',
      amount: transaction
        ? minorToDecimalString(Math.abs(transaction.amountMinor), transaction.currency)
        : (preset?.amount ?? ''),
      date: transaction?.date ?? preset?.date ?? today(),
      categoryId: transaction?.categoryId ?? preset?.categoryId ?? '',
      payeeId: transaction?.payeeId ?? preset?.payeeId ?? '',
      memo: transaction?.memo ?? preset?.memo ?? '',
      status: transaction?.status ?? 'cleared',
      excluded: transaction?.excluded ?? false,
    },
  });
  useEffect(() => {
    form.setValue('direction', direction);
  }, [direction, form]);
  const { mutate, isPending } = useMutation({
    mutationFn: (values: StandardTransactionValues) =>
      transaction
        ? updateTransactionAction(transaction.id, values)
        : createTransactionAction(values),
    onSuccess: async () => {
      toast.success(transaction ? 'Transaction updated' : 'Transaction created');
      await invalidate();
      form.reset();
      onDone();
    },
    onError: (error: Error) => toast.error(error.message || 'Could not save the transaction'),
  });
  return (
    <Form {...form}>
      <form className={s.form} onSubmit={form.handleSubmit(values => mutate(values))}>
        <FormField
          control={form.control}
          name="accountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account</FormLabel>
              <FormControl>
                <AccountPicker
                  value={field.value}
                  invalid={!!form.formState.errors.accountId}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormDescription>The account this {direction} belongs to.</FormDescription>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input inputMode="decimal" placeholder="0.00" autoComplete="off" {...field} />
              </FormControl>
              <FormDescription>
                In the account currency. Use a comma or dot for decimals.
              </FormDescription>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="payeeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payee</FormLabel>
              <FormControl>
                <PayeePicker
                  value={field.value}
                  onChange={payeeId => {
                    field.onChange(payeeId);
                    const payee = payees?.find(p => p.id === payeeId);
                    if (payee?.defaultCategoryId && !form.getValues('categoryId'))
                      form.setValue('categoryId', payee.defaultCategoryId);
                  }}
                />
              </FormControl>
              <FormDescription>Optional. Payees remember their usual category.</FormDescription>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <CategoryPicker
                  value={field.value || undefined}
                  kind={direction}
                  onChange={categoryId => field.onChange(categoryId ?? '')}
                />
              </FormControl>
              <FormDescription>
                Optional. Uncategorized entries wait in the review inbox.
              </FormDescription>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="memo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Memo</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>A short note about the transaction.</FormDescription>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <DateField value={field.value} onChange={field.onChange} />
              <FormDescription>When this transaction occurred.</FormDescription>
            </FormItem>
          )}
        />
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary" onClick={() => form.reset()}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" disabled={isPending}>
            {isPending ? <Loader2 className={s.spinner} /> : transaction ? 'Save' : 'Create'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

function TransferForm({
  transaction,
  preset,
  onDone,
}: {
  transaction?: TransactionRow;
  preset?: Partial<TransferValues>;
  onDone: () => void;
}) {
  const invalidate = useInvalidate();
  const { data: accounts } = useAccounts();
  const outLeg = transaction && transaction.amountMinor < 0;
  const form = useForm<TransferValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      fromAccountId: transaction
        ? outLeg
          ? transaction.accountId
          : (transaction.counterpartAccountId ?? '')
        : (preset?.fromAccountId ?? ''),
      toAccountId: transaction
        ? outLeg
          ? (transaction.counterpartAccountId ?? '')
          : transaction.accountId
        : (preset?.toAccountId ?? ''),
      amountFrom: transaction
        ? outLeg
          ? minorToDecimalString(-transaction.amountMinor, transaction.currency)
          : ''
        : (preset?.amountFrom ?? ''),
      amountTo:
        transaction && !outLeg
          ? minorToDecimalString(transaction.amountMinor, transaction.currency)
          : (preset?.amountTo ?? ''),
      date: transaction?.date ?? preset?.date ?? today(),
      memo: transaction?.memo ?? preset?.memo ?? '',
      status: transaction?.status ?? 'cleared',
    },
  });
  const fromId = form.watch('fromAccountId');
  const toId = form.watch('toAccountId');
  const from = accounts?.find(a => a.id === fromId);
  const to = accounts?.find(a => a.id === toId);
  const crossCurrency = !!from && !!to && from.currency !== to.currency;
  const { mutate, isPending } = useMutation({
    mutationFn: (values: TransferValues) =>
      transaction?.transferId
        ? updateTransferAction(transaction.transferId, values)
        : createTransferAction(values),
    onSuccess: async () => {
      toast.success(transaction ? 'Transfer updated' : 'Transfer recorded');
      await invalidate();
      form.reset();
      onDone();
    },
    onError: (error: Error) => toast.error(error.message || 'Could not save the transfer'),
  });
  return (
    <Form {...form}>
      <form className={s.form} onSubmit={form.handleSubmit(values => mutate(values))}>
        <FormField
          control={form.control}
          name="fromAccountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>From account</FormLabel>
              <FormControl>
                <AccountPicker
                  value={field.value}
                  invalid={!!form.formState.errors.fromAccountId}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormDescription>Money leaves this account.</FormDescription>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="toAccountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>To account</FormLabel>
              <FormControl>
                <AccountPicker
                  value={field.value}
                  invalid={!!form.formState.errors.toAccountId}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormDescription>
                Money arrives here. Paying a credit card is a transfer to the card.
              </FormDescription>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="amountFrom"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount sent{from ? ` (${from.currency})` : ''}</FormLabel>
              <FormControl>
                <Input inputMode="decimal" placeholder="0.00" autoComplete="off" {...field} />
              </FormControl>
              <FormDescription>Positive amount in the source account currency.</FormDescription>
            </FormItem>
          )}
        />
        {crossCurrency && (
          <FormField
            control={form.control}
            name="amountTo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount received ({to?.currency})</FormLabel>
                <FormControl>
                  <Input inputMode="decimal" placeholder="0.00" autoComplete="off" {...field} />
                </FormControl>
                <FormDescription>
                  Required for a cross-currency transfer; the ratio is the realised rate.
                </FormDescription>
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="memo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Memo</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>Shown on both legs.</FormDescription>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <DateField value={field.value} onChange={field.onChange} />
              <FormDescription>When the money moved.</FormDescription>
            </FormItem>
          )}
        />
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary" onClick={() => form.reset()}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <Loader2 className={s.spinner} />
            ) : transaction ? (
              'Save'
            ) : (
              'Record transfer'
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
