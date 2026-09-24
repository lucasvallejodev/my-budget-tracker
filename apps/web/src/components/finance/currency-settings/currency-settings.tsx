'use client';

import { useMutation } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { deleteExchangeRate, updateSettings, upsertExchangeRate } from '@/api/mutations';
import {
  Button,
  DatePicker,
  EmptyState,
  Field,
  FilterBar,
  Input,
  ListRow,
  Panel,
  QueryContent,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
  Table,
  TableCell,
  TableHeaderCell,
  TableRow,
  ToggleSwitch,
} from '@/components/ui';
import { ISO_DATE_LENGTH } from '@coinkeeper/shared/constants/time';

import {
  ExchangeRateRow,
  useCurrencies,
  useExchangeRates,
  useRefreshFinance,
  useSettings,
} from '../use-finance-data';

const FallbackCurrency = 'EUR';
const DeleteIconSize = 16;

type CurrencyOption = {
  code: string;
  name: string;
  symbol: string;
};

function CurrencySelect({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: CurrencyOption[];
  value: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map(currency => (
            <SelectItem key={currency.code} value={currency.code}>
              {currency.code} · {currency.name} ({currency.symbol})
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function RatesTable({
  onRemove,
  rates,
}: {
  onRemove: (rate: ExchangeRateRow) => void;
  rates: ExchangeRateRow[];
}) {
  return (
    <Table>
      <thead>
        <tr>
          <TableHeaderCell>From</TableHeaderCell>
          <TableHeaderCell>Pair</TableHeaderCell>
          <TableHeaderCell>Rate</TableHeaderCell>
          <TableHeaderCell>Source</TableHeaderCell>
          <TableHeaderCell>Action</TableHeaderCell>
        </tr>
      </thead>
      <tbody>
        {rates.map(rate => (
          <TableRow key={`${rate.base}-${rate.quote}-${rate.date}`}>
            <TableCell>{rate.date}</TableCell>
            <TableCell>
              1 {rate.base} → {rate.quote}
            </TableCell>
            <TableCell>{rate.rate}</TableCell>
            <TableCell>{rate.source}</TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete rate ${rate.base} to ${rate.quote} from ${rate.date}`}
                onClick={() => onRemove(rate)}
              >
                <Trash2 size={DeleteIconSize} />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </tbody>
    </Table>
  );
}

export function CurrencySettings() {
  const refresh = useRefreshFinance();
  const settings = useSettings();
  const currencies = useCurrencies();
  const rates = useExchangeRates();

  const [form, setForm] = useState({
    base: '',
    date: new Date().toISOString().slice(0, ISO_DATE_LENGTH),
    quote: '',
    rate: '',
  });

  const save = useMutation({
    mutationFn: updateSettings,
    onError: (error: Error) => toast.error(error.message),
    onSuccess: async () => {
      toast.success('Currency settings saved');
      await refresh();
    },
  });

  const addRate = useMutation({
    mutationFn: () => upsertExchangeRate(form),
    onError: (error: Error) => toast.error(error.message),
    onSuccess: async () => {
      toast.success('Rate saved');
      setForm(current => ({ ...current, rate: '' }));
      await refresh();
    },
  });

  const removeRate = useMutation({
    mutationFn: deleteExchangeRate,
    onError: (error: Error) => toast.error(error.message),
    onSuccess: refresh,
  });

  const primary = settings.data?.primaryCurrency ?? FallbackCurrency;
  const options = currencies.data ?? [];

  return (
    <Stack>
      <Panel
        title="Primary currency"
        description="Used as the default for new accounts and for the optional converted totals. Every report is still shown per currency."
      >
        {settings.isPending ? (
          <p role="status">Loading…</p>
        ) : (
          <Stack gap="medium">
            <Field>
              Primary currency
              <CurrencySelect
                options={options}
                label="Primary currency"
                value={primary}
                onChange={value => save.mutate({ primaryCurrency: value })}
              />
            </Field>
            <ListRow
              title="Show converted totals"
              description={`Adds an approximate total in ${primary} to the dashboard, converted with your manual rates and labelled with the rate date.`}
            >
              <ToggleSwitch
                aria-label="Show converted totals"
                checked={!!settings.data?.showConvertedTotals}
                onCheckedChange={checked => save.mutate({ showConvertedTotals: checked })}
              />
            </ListRow>
          </Stack>
        )}
      </Panel>
      <Panel
        title="Exchange rates"
        description="Rates are entered by hand for now. A rate applies from its date until a newer one is added; automatic sources can be plugged in later."
      >
        <form
          onSubmit={event => {
            event.preventDefault();
            addRate.mutate();
          }}
        >
          <FilterBar>
            <Field variant="filter">
              1 unit of
              <CurrencySelect
                options={options}
                label="Base currency"
                value={form.base}
                onChange={base => setForm(current => ({ ...current, base }))}
              />
            </Field>
            <Field variant="filter">
              equals (in)
              <CurrencySelect
                options={options}
                label="Quote currency"
                value={form.quote}
                onChange={quote => setForm(current => ({ ...current, quote }))}
              />
            </Field>
            <Field variant="filter">
              Rate
              <Input
                inputMode="decimal"
                placeholder="1.0850"
                value={form.rate}
                onChange={event => setForm(current => ({ ...current, rate: event.target.value }))}
              />
            </Field>
            <DatePicker
              label="From date"
              value={form.date}
              onChange={date => setForm(current => ({ ...current, date }))}
            />
            <Button
              type="submit"
              disabled={addRate.isPending || !form.base || !form.quote || !form.rate || !form.date}
            >
              Save rate
            </Button>
          </FilterBar>
        </form>
        <QueryContent
          pending={rates.isPending}
          loading="Loading rates…"
          empty={
            !rates.data?.length && (
              <EmptyState
                title="No exchange rates yet"
                description="Add a rate to enable converted totals across currencies."
              />
            )
          }
        >
          {() => <RatesTable rates={rates.data ?? []} onRemove={rate => removeRate.mutate(rate)} />}
        </QueryContent>
      </Panel>
    </Stack>
  );
}
