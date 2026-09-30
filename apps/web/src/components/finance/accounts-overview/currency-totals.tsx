import './currency-totals.scss';

import { Badge, Panel } from '@/components/ui';
import { formatMoney } from '@coinkeeper/shared/lib/money';

import { describeConversion } from '../conversion';
import type { AccountSummary, Summary } from '../use-finance-data';
import { countLabel, isActive, sumByCurrency } from './accounts-figures';

export function CurrencyTotals({
  accounts,
  converted,
}: {
  accounts: AccountSummary[];
  converted?: Summary['converted'];
}) {
  const active = accounts.filter(isActive);

  const totals = sumByCurrency(
    active.map(account => ({ amountMinor: account.balanceMinor, currency: account.currency }))
  );

  return (
    <Panel title="By currency">
      <ul className="currency-totals">
        {totals.map(total => (
          <li key={total.currency} className="currency-totals__row">
            <Badge tone="neutral">{total.currency}</Badge>
            <span className="currency-totals__count">
              {countLabel(
                active.filter(account => account.currency === total.currency).length,
                'account'
              )}
            </span>
            <span className="currency-totals__amount">
              {formatMoney(total.amountMinor, total.currency)}
            </span>
          </li>
        ))}
      </ul>
      {converted && (
        <div className="currency-totals__converted">
          <p className="currency-totals__row currency-totals__row--converted">
            <span className="currency-totals__count">≈ All in {converted.currency}</span>
            <span className="currency-totals__amount">
              {formatMoney(converted.netWorthMinor, converted.currency)}
            </span>
          </p>
          <p className="currency-totals__note">{describeConversion(converted)}</p>
        </div>
      )}
    </Panel>
  );
}
