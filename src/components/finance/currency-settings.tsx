'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { Panel, EmptyState } from './blocks';
import { Button } from '../primitives/button';
import { Input } from '../primitives/input';
import { ToggleSwitch } from '../primitives/preferences';
import { DatePicker } from '../primitives/date-picker';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../primitives/select';
import { FinanceKeys, useCurrencies, useExchangeRates, useSettings } from './use-finance-data';
import {
  deleteExchangeRateAction,
  updateSettingsAction,
  upsertExchangeRateAction,
} from '@/app/(main)/actions';
import s from './finance.module.scss';
import f from '../forms.module.scss';

function useRefresh() {
  const queryClient = useQueryClient();

  return () =>
    Promise.all(FinanceKeys.map(key => queryClient.invalidateQueries({ queryKey: [key] })));
}

type CurrencyOption = {
  code: string;
  name: string;
  symbol: string;
};

function CurrencySelect({
  value,
  onChange,
  label,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  options: CurrencyOption[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={f.full} aria-label={label}>
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

export function CurrencySettings() {
  const refresh = useRefresh();
  const settings = useSettings();
  const currencies = useCurrencies();
  const rates = useExchangeRates();

  const [form, setForm] = useState({
    base: '',
    quote: '',
    date: new Date().toISOString().slice(0, 10),
    rate: '',
  });

  const save = useMutation({
    mutationFn: updateSettingsAction,
    onSuccess: async () => {
      toast.success('Currency settings saved');
      await refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const addRate = useMutation({
    mutationFn: () => upsertExchangeRateAction(form),
    onSuccess: async () => {
      toast.success('Rate saved');
      setForm(current => ({ ...current, rate: '' }));
      await refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeRate = useMutation({
    mutationFn: deleteExchangeRateAction,
    onSuccess: refresh,
    onError: (error: Error) => toast.error(error.message),
  });

  const primary = settings.data?.primaryCurrency ?? 'EUR';
  const options = currencies.data ?? [];

  return (
    <div className={s.stack}>
      <Panel
        title="Primary currency"
        description="Used as the default for new accounts and for the optional converted totals. Every report is still shown per currency."
      >
        {settings.isPending ? (
          <p role="status">Loading…</p>
        ) : (
          <div className={s.form}>
            <label className={s.field}>
              Primary currency
              <CurrencySelect
                options={options}
                label="Primary currency"
                value={primary}
                onChange={value => save.mutate({ primaryCurrency: value })}
              />
            </label>
            <div className={s.row}>
              <div>
                <h3>Show converted totals</h3>
                <p>
                  Adds an approximate total in {primary} to the dashboard, converted with your
                  manual rates and labelled with the rate date.
                </p>
              </div>
              <ToggleSwitch
                aria-label="Show converted totals"
                checked={!!settings.data?.showConvertedTotals}
                onCheckedChange={checked => save.mutate({ showConvertedTotals: checked })}
              />
            </div>
          </div>
        )}
      </Panel>
      <Panel
        title="Exchange rates"
        description="Rates are entered by hand for now. A rate applies from its date until a newer one is added; automatic sources can be plugged in later."
      >
        <form
          className={s.filters}
          onSubmit={event => {
            event.preventDefault();
            addRate.mutate();
          }}
        >
          <label className={s.field}>
            1 unit of
            <CurrencySelect
              options={options}
              label="Base currency"
              value={form.base}
              onChange={base => setForm(current => ({ ...current, base }))}
            />
          </label>
          <label className={s.field}>
            equals (in)
            <CurrencySelect
              options={options}
              label="Quote currency"
              value={form.quote}
              onChange={quote => setForm(current => ({ ...current, quote }))}
            />
          </label>
          <label className={s.field}>
            Rate
            <Input
              inputMode="decimal"
              placeholder="1.0850"
              value={form.rate}
              onChange={event => setForm(current => ({ ...current, rate: event.target.value }))}
            />
          </label>
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
        </form>
        {rates.isPending ? (
          <p role="status">Loading rates…</p>
        ) : !rates.data?.length ? (
          <EmptyState
            title="No exchange rates yet"
            description="Add a rate to enable converted totals across currencies."
          />
        ) : (
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th scope="col">From</th>
                  <th scope="col">Pair</th>
                  <th scope="col">Rate</th>
                  <th scope="col">Source</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {rates.data.map(rate => (
                  <tr key={`${rate.base}-${rate.quote}-${rate.date}`}>
                    <td>{rate.date}</td>
                    <td>
                      1 {rate.base} → {rate.quote}
                    </td>
                    <td>{rate.rate}</td>
                    <td>{rate.source}</td>
                    <td>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete rate ${rate.base} to ${rate.quote} from ${rate.date}`}
                        onClick={() => removeRate.mutate(rate)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
