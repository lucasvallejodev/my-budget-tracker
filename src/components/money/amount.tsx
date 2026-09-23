import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/styles';
import s from '../finance/finance.module.scss';

/** Formats minor units with the currency; colours inflows green and outflows red when `signed`. */
export function Amount({
  amountMinor,
  currency,
  signed = false,
  flipSign = false,
  className,
}: {
  amountMinor: number;
  currency: string;
  signed?: boolean;
  /** Show liabilities as positive "owed" amounts. */
  flipSign?: boolean;
  className?: string;
}) {
  const value = flipSign ? -amountMinor : amountMinor;

  return (
    <span
      className={cn(
        signed && value > 0 && s.positive,
        signed && value < 0 && s.negative,
        className
      )}
    >
      {formatMoney(value, currency, { signDisplay: signed ? 'exceptZero' : 'auto' })}
    </span>
  );
}
