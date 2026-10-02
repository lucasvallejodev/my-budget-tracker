import { parseAmountInput } from '@coinkeeper/shared/lib/money';

const magnitudeOf = (text: string | undefined, currency: string): null | number => {
  if (!text?.trim()) return 0;

  try {
    return Math.abs(parseAmountInput(text, currency));
  } catch {
    return null;
  }
};

export const splitRemainder = (
  amount: string | undefined,
  lineAmounts: (string | undefined)[],
  currency: string
): null | number => {
  const total = magnitudeOf(amount, currency);
  const lines = lineAmounts.map(line => magnitudeOf(line, currency));

  if (total === null || lines.some(line => line === null)) return null;

  return lines.reduce<number>((left, line) => left - (line ?? 0), total);
};
