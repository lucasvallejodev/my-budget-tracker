'use client';

import { useState } from 'react';

import { upsertBudget } from '@/api/mutations';
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Field,
  FormStack,
  Input,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
} from '@/components/ui';
import { formatMoney, minorToDecimalString } from '@coinkeeper/shared/lib/money';

import { CategoryPicker } from '../category-picker';
import { useEntityMutation } from '../use-entity-mutation';
import { BudgetRow, monthLabel, useBudgetSuggestions } from '../use-finance-data';

const FallbackCurrency = 'EUR';

function CurrencySelect({
  disabled,
  onChange,
  options,
  value,
}: {
  disabled: boolean;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <Select value={value} disabled={disabled} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map(code => (
            <SelectItem key={code} value={code}>
              {code}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function SuggestionHint({
  amountMinor,
  currency,
  months,
  onUse,
}: {
  amountMinor: number;
  currency: string;
  months: number;
  onUse: () => void;
}) {
  return (
    <Field as="div">
      <Text size="small" tone="muted">
        You spent about {formatMoney(amountMinor, currency)} a month over the last {months} month
        {months === 1 ? '' : 's'}.
      </Text>
      <Button type="button" variant="outline" size="sm" onClick={onUse}>
        Use {formatMoney(amountMinor, currency)}
      </Button>
    </Field>
  );
}

export function BudgetDialog({
  budget,
  currencies,
  month,
  onClose,
  onSaved,
}: {
  budget: Partial<BudgetRow>;
  currencies: string[];
  month: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [categoryId, setCategoryId] = useState<string | undefined>(budget.categoryId);
  const [currency, setCurrency] = useState(budget.currency ?? currencies[0] ?? FallbackCurrency);

  const [amount, setAmount] = useState(
    budget.amountMinor
      ? minorToDecimalString(budget.amountMinor, budget.currency ?? FallbackCurrency)
      : ''
  );

  const suggestions = useBudgetSuggestions(month);

  const suggestion = suggestions.data?.find(
    item => item.categoryId === categoryId && item.currency === currency
  );

  const save = useEntityMutation({
    mutationFn: () =>
      upsertBudget({
        amount,
        categoryId: categoryId!,
        currency,
        month,
      }),
    onSuccess: onSaved,
    successMessage: 'Budget saved',
  });

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent>
        <DialogTitle>
          {budget.id ? 'Edit budget' : 'Add budget'} · {monthLabel(month)}
        </DialogTitle>
        <FormStack
          onSubmit={event => {
            event.preventDefault();
            save.mutate();
          }}
        >
          <Field as="div">
            Category
            <CategoryPicker
              value={categoryId}
              kind="expense"
              onChange={setCategoryId}
              disabled={!!budget.id}
            />
          </Field>
          <Field>
            Currency
            <CurrencySelect
              value={currency}
              options={currencies}
              disabled={!!budget.id}
              onChange={setCurrency}
            />
          </Field>
          <Field>
            Monthly limit
            <Input
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={event => setAmount(event.target.value)}
              required
            />
          </Field>
          {suggestion && (
            <SuggestionHint
              amountMinor={suggestion.amountMinor}
              currency={currency}
              months={suggestion.months}
              onUse={() => setAmount(minorToDecimalString(suggestion.amountMinor, currency))}
            />
          )}
          <Button type="submit" disabled={save.isPending || !categoryId || !amount.trim()}>
            Save budget
          </Button>
        </FormStack>
      </DialogContent>
    </Dialog>
  );
}
