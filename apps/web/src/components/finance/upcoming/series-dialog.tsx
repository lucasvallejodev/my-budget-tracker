'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Control, useForm, useWatch } from 'react-hook-form';

import { createSeries, updateSeries } from '@/api/mutations';
import {
  Dialog,
  DialogContent,
  DialogFormFooter,
  DialogTitle,
  Field,
  Form,
  FormStack,
  saveLabel,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TextField,
  ToggleSwitch,
} from '@/components/ui';
import { RecurringKindValues } from '@coinkeeper/shared/schema/enums';
import { recurringFormSchema, type RecurringFormValues } from '@coinkeeper/shared/schema/recurring';

import { RecurringKindLabels } from '../recurring-labels';
import {
  AccountField,
  AmountField,
  CategoryField,
  DateField,
  PayeeField,
} from '../transaction-dialog';
import { useEntityMutation } from '../use-entity-mutation';
import type { RecurringSeriesRow } from '../use-finance-data';
import { frequencyOptions, frequencyValue, parseFrequency, seriesDefaults } from './series-form';

type Values = RecurringFormValues;

function ChoiceField({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  value: string;
}) {
  return (
    <Field as="div">
      {label}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function SwitchField({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <Field as="label">
      <ToggleSwitch checked={checked} onCheckedChange={onChange} />
      {label}
    </Field>
  );
}

const KindOptions = RecurringKindValues.map(kind => ({
  label: RecurringKindLabels[kind],
  value: kind,
}));

function ScheduleFields({
  control,
  setValue,
}: {
  control: Control<Values>;
  setValue: (patch: Partial<Values>) => void;
}) {
  const [cadence, interval, kind] = useWatch({ control, name: ['cadence', 'interval', 'kind'] });

  return (
    <>
      <ChoiceField
        label="Type"
        options={KindOptions}
        value={kind}
        onChange={value => setValue({ kind: value as Values['kind'] })}
      />
      <AmountField
        control={control}
        name="amount"
        label="Amount"
        description="The usual amount. Payments within 7.5 % of it are matched automatically."
      />
      <ChoiceField
        label="Repeats"
        options={frequencyOptions({ cadence, interval })}
        value={frequencyValue(cadence, interval)}
        onChange={value => setValue(parseFrequency(value))}
      />
      <DateField
        control={control}
        name="anchorDate"
        label="First due date"
        description="A date it is due on; the next ones follow the repeat."
      />
      <DateField control={control} name="endDate" label="Ends" description="Optional." />
    </>
  );
}

export function SeriesDialog({
  initial,
  onClose,
  series,
}: {
  initial?: Values;
  onClose: () => void;
  series?: RecurringSeriesRow;
}) {
  const form = useForm<Values>({
    defaultValues: initial ?? seriesDefaults(series),
    resolver: zodResolver(recurringFormSchema),
  });

  const [kind, recordMode, status] = useWatch({
    control: form.control,
    name: ['kind', 'recordMode', 'status'],
  });

  const setValues = (patch: Partial<Values>) =>
    Object.entries(patch).forEach(([key, value]) => form.setValue(key as keyof Values, value));

  const { isPending, mutate } = useEntityMutation({
    errorMessage: 'Could not save the recurring payment',
    mutationFn: (values: Values) =>
      series ? updateSeries(series.id, values) : createSeries(values),
    onSuccess: onClose,
    successMessage: series ? 'Recurring payment updated' : 'Recurring payment added',
  });

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent>
        <DialogTitle>{series ? 'Edit recurring payment' : 'New recurring payment'}</DialogTitle>
        <Form {...form}>
          <FormStack onSubmit={form.handleSubmit(values => mutate(values))}>
            <TextField
              control={form.control}
              name="name"
              label="Name"
              description="For example Rent, Netflix or Salary."
            />
            <AccountField
              control={form.control}
              name="accountId"
              label="Account"
              description="Where it is paid from or into."
            />
            <ScheduleFields control={form.control} setValue={setValues} />
            <PayeeField control={form.control} onSelect={() => undefined} />
            <CategoryField control={form.control} kind={kind === 'income' ? 'income' : 'expense'} />
            <SwitchField
              label="Add it to Review when it is due"
              checked={recordMode === 'create_pending'}
              onChange={checked =>
                setValues({ recordMode: checked ? 'create_pending' : 'match_only' })
              }
            />
            {series && (
              <SwitchField
                label="Paused"
                checked={status === 'paused'}
                onChange={checked => setValues({ status: checked ? 'paused' : 'active' })}
              />
            )}
            <DialogFormFooter
              isPending={isPending}
              submitLabel={saveLabel(!!series, 'Add')}
              onCancel={onClose}
            />
          </FormStack>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
