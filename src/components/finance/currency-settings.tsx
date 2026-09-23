'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  deleteExchangeRateAction,
  updateSettingsAction,
  upsertExchangeRateAction,
} from '@/app/(main)/actions';
import { ISO_DATE_LENGTH } from '@/constants/time';

import formStyles from '../forms.module.scss';
import { Button } from '../primitives/button';
import { DatePicker } from '../primitives/date-picker';
import { Input } from '../primitives/input';
import { ToggleSwitch } from '../primitives/preferences';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../primitives/select';
import { EmptyState, Panel, QueryContent } from './blocks';
import styles from './finance.module.scss';
import { FinanceKeys, useCurrencies, useExchangeRates, useSettings } from './use-finance-data';

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
      <SelectTrigger className={formStyles.full} aria-label={label}>
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
    date: new Date().toISOString().slice(0, ISO_DATE_LENGTH),
    quote: '',
    rate: '',
  });

  const save = useMutation({
    mutationFn: updateSettingsAction,
    onError: (error: Error) => toast.error(error.message),
    onSuccess: async () => {
      toast.success('Currency settings saved');
      await refresh();
    },
  });

  const addRate = useMutation({
    mutationFn: () => upsertExchangeRateAction(form),
    onError: (error: Error) => toast.error(error.message),
    onSuccess: async () => {
      toast.success('Rate saved');
      setForm(current => ({ ...current, rate: '' }));
      await refresh();
    },
  });

  const removeRate = useMutation({
    mutationFn: deleteExchangeRateAction,
    onError: (error: Error) => toast.error(error.message),
    onSuccess: refresh,
  });

  const primary = settings.data?.primaryCurrency ?? 'EUR';
  const options = currencies.data ?? [];

  return (
    <div className={styles.stack}>
      <Panel
        title="Primary currency"
        description="Used as the default for new accounts and for the optional converted totals. Every report is still shown per currency."
      >
        {settings.isPending ? (
          <p role="status">Loading…</p>
        ) : (
          <div className={styles.form}>
            <label className={styles.field}>
              Primary currency
              <CurrencySelect
                options={options}
                label="Primary currency"
                value={primary}
                onChange={value => save.mutate({ primaryCurrency: value })}
              />
            </label>
            <div className={styles.row}>
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
          className={styles.filters}
          onSubmit={event => {
            event.preventDefault();
            addRate.mutate();
          }}
        >
          <label className={styles.field}>
            1 unit of
            <CurrencySelect
              options={options}
              label="Base currency"
              value={form.base}
              onChange={base => setForm(current => ({ ...current, base }))}
            />
          </label>
          <label className={styles.field}>
            equals (in)
            <CurrencySelect
              options={options}
              label="Quote currency"
              value={form.quote}
              onChange={quote => setForm(current => ({ ...current, quote }))}
            />
          </label>
          <label className={styles.field}>
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
          {() => (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
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
                  {(rates.data ?? []).map(rate => (
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
        </QueryContent>
      </Panel>
    </div>
  );
}
