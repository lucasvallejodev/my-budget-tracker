'use client';
import s from '@/components/forms.module.scss';

import { ComponentProps, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/primitives/button';
import { Loader2, PlusSquareIcon } from 'lucide-react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
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
import { accountFormSchema, AccountFormValues } from '@/schema/accounts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createAccountAction, updateAccountAction } from '../actions';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/primitives/select';
import { accountTypes } from '@/constants/account';
import {
  AccountSummary,
  FINANCE_KEYS,
  useCurrencies,
  useSettings,
} from '@/components/finance/use-finance-data';

type CreateAccountDialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCloseAutoFocus?: ComponentProps<typeof DialogContent>['onCloseAutoFocus'];
  onSuccessCallback?: (account: { id: string; name: string }) => void;
  account?: AccountSummary;
  trigger?: React.ReactNode;
};

function CreateAccountDialog({
  onSuccessCallback,
  open: controlledOpen,
  onOpenChange,
  onCloseAutoFocus,
  account,
  trigger,
}: CreateAccountDialogProps) {
  const [localOpen, setLocalOpen] = useState(false);
  const open = controlledOpen ?? localOpen;
  const setOpen = (value: boolean) => {
    setLocalOpen(value);
    onOpenChange?.(value);
  };
  const { data: currencies } = useCurrencies();
  const { data: settings } = useSettings();
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      type: account?.type ?? 'checking',
      name: account?.name ?? '',
      currency: account?.currency ?? settings?.primaryCurrency ?? 'EUR',
      accountNumber: account?.accountNumber ?? '',
      institution: account?.institution ?? '',
      notes: account?.notes ?? '',
      openingBalance: '',
    },
    values: account
      ? {
          type: account.type,
          name: account.name,
          currency: account.currency,
          accountNumber: account.accountNumber ?? '',
          institution: account.institution ?? '',
          notes: account.notes ?? '',
          openingBalance: '',
        }
      : undefined,
  });

  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: ({ openingBalance, ...values }: AccountFormValues) =>
      account
        ? updateAccountAction({ id: account.id, ...values })
        : createAccountAction({ ...values, openingBalance }),
    onSuccess: async data => {
      toast.success(`Account ${data.name} saved`);
      await Promise.all(
        FINANCE_KEYS.map(key => queryClient.invalidateQueries({ queryKey: [key] }))
      );
      form.reset();
      onSuccessCallback?.(data);
      setOpen(false);
    },
    onError: (error: Error) => toast.error(error.message || 'Error saving account'),
  });
  const currencyLocked = !!account && account.transactionCount > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button variant="ghost" className={s.create} onClick={() => setOpen(true)}>
              <PlusSquareIcon className={s.smallIcon} />
              Create new
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent onCloseAutoFocus={onCloseAutoFocus}>
        <DialogTitle>{account ? 'Edit account' : 'Create new account'}</DialogTitle>
        <DialogDescription>
          Each account has one currency. Credit cards and loans are liabilities: money you owe.
        </DialogDescription>
        <Form {...form}>
          <form className={s.form} onSubmit={form.handleSubmit(values => mutate(values))}>
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account type</FormLabel>
                  <Select value={field.value} onValueChange={value => field.onChange(value)}>
                    <FormControl>
                      <SelectTrigger className={s.full}>
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Account types</SelectLabel>
                        {accountTypes.map(accountType => (
                          <SelectItem key={accountType.value} value={accountType.value}>
                            {accountType.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormDescription>The type of the account.</FormDescription>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="Account name" {...field} />
                  </FormControl>
                  <FormDescription>The name of the account.</FormDescription>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select
                    value={field.value}
                    disabled={currencyLocked}
                    onValueChange={value => field.onChange(value)}
                  >
                    <FormControl>
                      <SelectTrigger className={s.full}>
                        <SelectValue placeholder="Select a currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Currencies</SelectLabel>
                        {(currencies ?? []).map(currency => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.code} · {currency.name} ({currency.symbol})
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {currencyLocked
                      ? 'The currency cannot change once the account has transactions.'
                      : 'Fixed once the account has transactions.'}
                  </FormDescription>
                </FormItem>
              )}
            />
            {!account && (
              <FormField
                control={form.control}
                name="openingBalance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opening balance</FormLabel>
                    <FormControl>
                      <Input inputMode="decimal" placeholder="0.00" autoComplete="off" {...field} />
                    </FormControl>
                    <FormDescription>
                      Current balance to start from. For a credit card, enter what you owe as a
                      negative number.
                    </FormDescription>
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="accountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account number</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="Last 4 digits" {...field} />
                  </FormControl>
                  <FormDescription>Optional, e.g. the last four digits.</FormDescription>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="institution"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Institution</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="Institution name" {...field} />
                  </FormControl>
                  <FormDescription>The bank or provider.</FormDescription>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="Account notes" {...field} />
                  </FormControl>
                  <FormDescription>
                    Anything you want to remember about this account.
                  </FormDescription>
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary" onClick={() => form.reset()}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="submit"
            disabled={isPending}
            onClick={form.handleSubmit(values => mutate(values))}
          >
            {isPending ? <Loader2 className={s.spinner} /> : account ? 'Save' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CreateAccountDialog;
