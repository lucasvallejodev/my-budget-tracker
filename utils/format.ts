type FormatCurrencyOptions = {
  currency?: 'USD' | 'EUR';
  format?: 'en-US' | 'de-DE' | 'es-ES';
  fractionDigits?: number;
}

export const formatCurrency = (amount: number, options: FormatCurrencyOptions = {}) => {
  const { currency, format, fractionDigits } = options;
  return new Intl.NumberFormat(format ?? 'es-ES', {
    style: 'currency',
    currency: currency ?? 'EUR',
    minimumFractionDigits: fractionDigits ?? 2,
    maximumFractionDigits: fractionDigits ?? 2,
  }).format(amount);
}
