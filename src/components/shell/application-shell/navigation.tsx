'use client';

import './navigation.scss';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { MainRouteItems } from '@/app/(main)/routes';
import { AccountSummary, useAccounts } from '@/components/finance';
import { AccountGroups } from '@/constants/account';
import { formatMoney } from '@/lib/money';

const displayBalance = (account: AccountSummary) =>
  account.classification === 'liability' ? -account.balanceMinor : account.balanceMinor;

const totalsByCurrency = (members: AccountSummary[]) => {
  const totals = new Map<string, number>();

  for (const account of members) {
    totals.set(account.currency, (totals.get(account.currency) ?? 0) + displayBalance(account));
  }

  return [...totals.entries()].map(([currency, total]) => formatMoney(total, currency)).join(' · ');
};

export function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  const { data: accounts = [] } = useAccounts();

  return (
    <nav aria-label="Main navigation" className="navigation">
      <div className="navigation__links">
        {MainRouteItems.map(item => (
          <Link
            key={item.path}
            className="navigation__link"
            href={item.path}
            aria-current={path === item.path ? 'page' : undefined}
            onClick={onNavigate}
          >
            <item.icon />
            {item.name}
          </Link>
        ))}
      </div>
      {AccountGroups.map(group => {
        const members = accounts.filter(account =>
          (group.types as string[]).includes(account.type)
        );

        if (!members.length) return null;

        return (
          <div key={group.label}>
            <h2 className="navigation__section-label">
              {group.label}
              <span className="navigation__section-total">{totalsByCurrency(members)}</span>
            </h2>
            <div className="navigation__links">
              {members.map(account => (
                <Link
                  key={account.id}
                  className="navigation__link"
                  href={`/accounts/${account.id}`}
                  aria-current={path === `/accounts/${account.id}` ? 'page' : undefined}
                  onClick={onNavigate}
                >
                  <span>{account.name}</span>
                  <span className="navigation__link-amount">
                    {formatMoney(displayBalance(account), account.currency)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
