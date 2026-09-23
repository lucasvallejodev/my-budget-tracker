'use client';

import { Control, FieldValues } from 'react-hook-form';

import {
  FormControl,
  FormDescription,
  FormField,
  FormFieldProps,
  FormItem,
  FormLabel,
  TextField,
} from '@/components/ui';
import { StandardTransactionValues } from '@/schema/transaction';

import { AccountPicker } from '../account-picker';
import { CategoryPicker } from '../category-picker';
import { PayeePicker } from '../payee-picker';

export { AmountField, DateField } from '@/components/ui';

export function MemoField<T extends FieldValues>(props: Omit<FormFieldProps<T>, 'label'>) {
  return <TextField label="Memo" {...props} />;
}

export function AccountField<T extends FieldValues>({
  control,
  description,
  label,
  name,
}: FormFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <AccountPicker
              value={field.value}
              invalid={!!fieldState.error}
              onChange={field.onChange}
            />
          </FormControl>
          <FormDescription>{description}</FormDescription>
        </FormItem>
      )}
    />
  );
}

type StandardFieldProps = { control: Control<StandardTransactionValues> };

export function PayeeField({
  control,
  onSelect,
}: StandardFieldProps & { onSelect: (payeeId: string) => void }) {
  return (
    <FormField
      control={control}
      name="payeeId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Payee</FormLabel>
          <FormControl>
            <PayeePicker
              value={field.value}
              onChange={payeeId => {
                field.onChange(payeeId);
                onSelect(payeeId);
              }}
            />
          </FormControl>
          <FormDescription>Optional. Payees remember their usual category.</FormDescription>
        </FormItem>
      )}
    />
  );
}

export function CategoryField({
  control,
  kind,
}: StandardFieldProps & { kind: 'expense' | 'income' }) {
  return (
    <FormField
      control={control}
      name="categoryId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Category</FormLabel>
          <FormControl>
            <CategoryPicker
              value={field.value || undefined}
              kind={kind}
              onChange={categoryId => field.onChange(categoryId ?? '')}
            />
          </FormControl>
          <FormDescription>
            Optional. Uncategorized entries wait in the review inbox.
          </FormDescription>
        </FormItem>
      )}
    />
  );
}
