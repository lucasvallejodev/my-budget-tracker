'use client';

import { useState } from 'react';

import { SegmentedControl } from '@/components/ui';
import { RememberedFields, rememberedValue, rememberValue } from '@/lib/form-memory';
import { useHydrated } from '@/lib/hydration';

export const ConvertedView = 'converted';

const pickView = (
  candidates: string[],
  currencies: string[],
  primary: string,
  allowConverted: boolean
) => {
  const valid = candidates.find(
    candidate => currencies.includes(candidate) || (allowConverted && candidate === ConvertedView)
  );

  if (valid) return valid;

  return currencies.includes(primary) ? primary : (currencies[0] ?? primary);
};

export function useCurrencyView(
  currencies: string[],
  primary: string,
  allowConverted = false
): [string, (view: string) => void] {
  const hydrated = useHydrated();
  const [chosen, setChosen] = useState('');
  const remembered = hydrated ? rememberedValue(RememberedFields.currencyView) : '';

  const choose = (view: string) => {
    setChosen(view);
    rememberValue(RememberedFields.currencyView, view);
  };

  return [pickView([chosen, remembered], currencies, primary, allowConverted), choose];
}

export function CurrencySwitch({
  converted,
  currencies,
  onChange,
  primary,
  value,
}: {
  converted?: boolean;
  currencies: string[];
  onChange: (view: string) => void;
  primary: string;
  value: string;
}) {
  const options = [
    ...currencies.map(currency => ({ label: currency, value: currency })),
    ...(converted ? [{ label: `≈ All in ${primary}`, value: ConvertedView }] : []),
  ];

  if (options.length <= 1) return null;

  return <SegmentedControl label="Currency" options={options} value={value} onChange={onChange} />;
}
