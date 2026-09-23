'use client';

import { Control } from 'react-hook-form';

import { AccountSummary } from '@/components/finance/use-finance-data';
import styles from '@/components/forms.module.scss';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/primitives/form';
import { AmountField, TextField } from '@/components/primitives/form-fields';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/primitives/select';
import { AccountTypes } from '@/constants/account';
import type { Currency } from '@/db/schema';
import { AccountFormValues } from '@/schema/accounts';

import { createAccountAction, updateAccountAction } from '../actions';

type AccountFieldProps = { control: Control<AccountFormValues> };

const blankAccount = (currency: string): AccountFormValues => ({
  accountNumber: '',
  currency,
  institution: '',
  name: '',
  notes: '',
  openingBalance: '',
  type: 'checking',
});

export const accountDefaults = (
  account: AccountSummary | undefined,
  currency: string
): AccountFormValues =>
  account
    ? {
        accountNumber: account.accountNumber ?? '',
        currency: account.currency,
        institution: account.institution ?? '',
        name: account.name,
        notes: account.notes ?? '',
        openingBalance: '',
        type: account.type,
      }
    : blankAccount(currency);

export const saveAccount = (
  account: AccountSummary | undefined,
  { openingBalance, ...values }: AccountFormValues
) =>
  account
    ? updateAccountAction({ id: account.id, ...values })
    : createAccountAction({ ...values, openingBalance });

function AccountTypeField({ control }: AccountFieldProps) {
  return (
    <FormField
      control={control}
      name="type"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Account type</FormLabel>
          <Select value={field.value} onValueChange={value => field.onChange(value)}>
            <FormControl>
              <SelectTrigger className={styles.full}>
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Account types</SelectLabel>
                {AccountTypes.map(accountType => (
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
  );
}

function CurrencyField({
  control,
  currencies,
  locked,
}: AccountFieldProps & { currencies: Currency[]; locked: boolean }) {
  return (
    <FormField
      control={control}
      name="currency"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Currency</FormLabel>
          <Select
            value={field.value}
            disabled={locked}
            onValueChange={value => field.onChange(value)}
          >
            <FormControl>
              <SelectTrigger className={styles.full}>
                <SelectValue placeholder="Select a currency" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Currencies</SelectLabel>
                {currencies.map(currency => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.code} · {currency.name} ({currency.symbol})
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <FormDescription>
            {locked
              ? 'The currency cannot change once the account has transactions.'
              : 'Fixed once the account has transactions.'}
          </FormDescription>
        </FormItem>
      )}
    />
  );
}

export function AccountFormFields({
  account,
  control,
  currencies,
}: AccountFieldProps & { account?: AccountSummary; currencies: Currency[] }) {
  const currencyLocked = !!account && account.transactionCount > 0;

  return (
    <>
      <AccountTypeField control={control} />
      <TextField
        control={control}
        name="name"
        label="Name"
        placeholder="Account name"
        description="The name of the account."
      />
      <CurrencyField control={control} currencies={currencies} locked={currencyLocked} />
      {!account && (
        <AmountField
          control={control}
          name="openingBalance"
          label="Opening balance"
          description="Current balance to start from. For a credit card, enter what you owe as a negative number."
        />
      )}
      <TextField
        control={control}
        name="accountNumber"
        label="Account number"
        placeholder="Last 4 digits"
        description="Optional, e.g. the last four digits."
      />
      <TextField
        control={control}
        name="institution"
        label="Institution"
        placeholder="Institution name"
        description="The bank or provider."
      />
      <TextField
        control={control}
        name="notes"
        label="Notes"
        placeholder="Account notes"
        description="Anything you want to remember about this account."
      />
    </>
  );
}
