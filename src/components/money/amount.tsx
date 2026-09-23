import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/styles';

import styles from '../finance/finance.module.scss';

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
    <span
      className={cn(
        signed && value > 0 && styles.positive,
        signed && value < 0 && styles.negative,
        className
      )}
    >
      {formatMoney(value, currency, { signDisplay: signed ? 'exceptZero' : 'auto' })}
    </span>
  );
}
