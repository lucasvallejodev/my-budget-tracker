'use client';

import './account-group.scss';

import { ChevronDown } from 'lucide-react';
import { Fragment, useId, useState } from 'react';

import { cn } from '@/lib/styles';
import { formatMoney } from '@coinkeeper/shared/lib/money';

import type { AccountSummary } from '../use-finance-data';
import { AccountRow } from './account-row';
import {
  type AccountGroupFigures,
  type BalancesByAccount,
  countLabel,
  type CurrencyAmount,
  isLiability,
  paymentAccountFor,
} from './accounts-figures';

function GroupChange({ changes, liability }: { changes: CurrencyAmount[]; liability: boolean }) {
  const moved = changes.filter(change => change.amountMinor);

  if (!moved.length) return <>No change this month</>;

  return (
    <>
      {moved.map((change, index) => (
        <Fragment key={change.currency}>
          {index ? ', ' : ''}
          <span
            className={cn('account-group__change', {
              'account-group__change--down': liability
                ? change.amountMinor > 0
                : change.amountMinor < 0,
            })}
          >
            {formatMoney(change.amountMinor, change.currency, { signDisplay: 'exceptZero' })}
          </span>
        </Fragment>
      ))}{' '}
      this month
    </>
  );
}

function GroupTotals({ liability, totals }: { liability: boolean; totals: CurrencyAmount[] }) {
  return (
    <div className="account-group__totals">
      {totals.map(total => (
        <span key={total.currency} className="account-group__total">
          {formatMoney(liability ? -total.amountMinor : total.amountMinor, total.currency)}
          {liability && <span className="account-group__owed">owed</span>}
        </span>
      ))}
    </div>
  );
}

export function AccountGroup({
  accounts,
  balances,
  group,
}: {
  accounts: AccountSummary[];
  balances: BalancesByAccount;
  group: AccountGroupFigures;
}) {
  const [open, setOpen] = useState(true);
  const listId = useId();

  return (
    <section className="account-group">
      <header className="account-group__head">
        <h2 className="account-group__heading">
          <button
            type="button"
            className="account-group__toggle"
            aria-expanded={open}
            aria-controls={listId}
            onClick={() => setOpen(visible => !visible)}
          >
            <ChevronDown
              aria-hidden
              className={cn('account-group__chevron', {
                'account-group__chevron--closed': !open,
              })}
            />
            {group.label}
          </button>
        </h2>
        <p className="account-group__meta">
          {countLabel(group.accounts.length, 'account')} ·{' '}
          <GroupChange changes={group.changes} liability={group.liability} />
        </p>
        <GroupTotals liability={group.liability} totals={group.totals} />
      </header>
      <ul id={listId} className="account-group__list" hidden={!open}>
        {group.accounts.map(account => (
          <AccountRow
            key={account.id}
            account={account}
            balances={balances}
            paymentAccountId={
              isLiability(account) ? paymentAccountFor(account, accounts) : undefined
            }
          />
        ))}
      </ul>
    </section>
  );
}
