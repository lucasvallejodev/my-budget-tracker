'use client';

import './split-lines.scss';

import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Control, useFieldArray, UseFormReturn, useWatch } from 'react-hook-form';

import { Button, FormField, Input, ToggleSwitch } from '@/components/ui';
import { cn } from '@/lib/styles';
import { FALLBACK_CURRENCY } from '@coinkeeper/shared/constants/money';
import { formatMoney } from '@coinkeeper/shared/lib/money';
import {
  MAX_SPLIT_LINES,
  MIN_SPLIT_LINES,
  type StandardTransactionValues,
} from '@coinkeeper/shared/schema/transaction';

import { CategoryPicker } from '../category-picker';
import { useAccounts } from '../use-finance-data';
import { splitRemainder } from './split-remainder';
import { CategoryField } from './transaction-fields';

const ActionIconSize = 16;

const EmptyLine = {
  amount: '',
  categoryId: '',
  memo: '',
};

type SplitLinesProps = {
  control: Control<StandardTransactionValues>;
  currency: string;
  direction: 'expense' | 'income';
};

function remainderText(remaining: null | number, currency: string): string {
  if (remaining === null) return 'Check the amounts';
  if (remaining === 0) return 'Everything is assigned';
  if (remaining < 0) return `${formatMoney(-remaining, currency)} over the amount`;

  return `${formatMoney(remaining, currency)} left to assign`;
}

function SplitLines({ control, currency, direction }: SplitLinesProps) {
  const { append, fields, remove } = useFieldArray({ control, name: 'splits' });
  const [amount, lines] = useWatch({ control, name: ['amount', 'splits'] });

  const remaining = splitRemainder(
    amount,
    (lines ?? []).map(line => line.amount),
    currency
  );

  return (
    <fieldset className="split-lines">
      <legend className="split-lines__legend">Split between categories</legend>
      {fields.map((field, index) => (
        <div className="split-lines__line" key={field.id}>
          <div className="split-lines__category">
            <FormField
              control={control}
              name={`splits.${index}.categoryId`}
              render={({ field: category, fieldState }) => (
                <CategoryPicker
                  value={category.value || undefined}
                  kind={direction}
                  invalid={!!fieldState.error}
                  label={`Category of line ${index + 1}`}
                  placeholder="Choose category"
                  onChange={categoryId => category.onChange(categoryId ?? '')}
                />
              )}
            />
          </div>
          <FormField
            control={control}
            name={`splits.${index}.amount`}
            render={({ field: lineAmount, fieldState }) => (
              <Input
                {...lineAmount}
                className="split-lines__amount"
                inputMode="decimal"
                aria-invalid={!!fieldState.error}
                aria-label={`Amount of line ${index + 1}`}
                placeholder="0.00"
              />
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Remove line ${index + 1}`}
            disabled={fields.length <= MIN_SPLIT_LINES}
            onClick={() => remove(index)}
          >
            <Trash2 size={ActionIconSize} />
          </Button>
        </div>
      ))}
      <div className="split-lines__footer">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={fields.length >= MAX_SPLIT_LINES}
          onClick={() => append(EmptyLine)}
        >
          Add line
        </Button>
        <span
          role="status"
          className={cn('split-lines__remaining', {
            'split-lines__remaining--open': remaining !== 0,
          })}
        >
          {remainderText(remaining, currency)}
        </span>
      </div>
    </fieldset>
  );
}

type Values = StandardTransactionValues;

export function useSplitting(form: UseFormReturn<Values>, hadSplits: boolean) {
  const [splitting, setSplitting] = useState(() => !!form.getValues('splits')?.length);

  const toggle = (on: boolean) => {
    const seed = [
      {
        amount: form.getValues('amount'),
        categoryId: form.getValues('categoryId') ?? '',
        memo: '',
      },
      EmptyLine,
    ];

    form.setValue('splits', on ? seed : []);
    setSplitting(on);
  };

  const prepare = (values: Values): Values => {
    if (splitting) return { ...values, categoryId: '' };

    return { ...values, splits: hadSplits ? [] : undefined };
  };

  return {
    prepare,
    splitting,
    toggle,
  };
}

export function CategoryOrSplit({
  control,
  direction,
  onToggle,
  splitting,
}: Omit<SplitLinesProps, 'currency'> & { onToggle: (on: boolean) => void; splitting: boolean }) {
  const accountId = useWatch({ control, name: 'accountId' });
  const { data: accounts } = useAccounts();
  const currency = accounts?.find(account => account.id === accountId)?.currency;

  return (
    <>
      <label className="split-lines__toggle">
        <ToggleSwitch checked={splitting} onCheckedChange={onToggle} />
        Split between categories
      </label>
      {splitting ? (
        <SplitLines
          control={control}
          currency={currency ?? FALLBACK_CURRENCY}
          direction={direction}
        />
      ) : (
        <CategoryField control={control} kind={direction} />
      )}
    </>
  );
}
