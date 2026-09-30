import './amount.scss';

import { cn } from '@/lib/styles';
import { formatMoney } from '@coinkeeper/shared/lib/money';

import { Text } from '../text';

const amountTone = (value: number, signed: boolean) =>
  signed && value > 0 ? 'positive' : 'default';

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
    <Text as="span" tone={amountTone(value, signed)} className={cn('amount', className)}>
      {formatMoney(value, currency, { signDisplay: signed ? 'exceptZero' : 'auto' })}
    </Text>
  );
}
