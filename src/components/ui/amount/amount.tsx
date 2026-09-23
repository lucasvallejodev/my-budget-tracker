import { formatMoney } from '@/lib/money';

import { Text } from '../text';

const amountTone = (value: number, signed: boolean) => {
  if (!signed || value === 0) return 'default';

  return value > 0 ? 'positive' : 'negative';
};

export function Amount({
  amountMinor,
  className,
  currency,
  flipSign = false,
  signed = false,
}: {
  amountMinor: number;
  className?: string;
  currency: string;
  flipSign?: boolean;
  signed?: boolean;
}) {
  const value = flipSign ? -amountMinor : amountMinor;

  return (
    <Text as="span" tone={amountTone(value, signed)} className={className}>
      {formatMoney(value, currency, { signDisplay: signed ? 'exceptZero' : 'auto' })}
    </Text>
  );
}
