import './account-row.scss';

import Link from 'next/link';

import { Avatar, Badge, Sparkline } from '@/components/ui';
import { accountTypeStyle } from '@/constants/account';
import { formatMoney } from '@coinkeeper/shared/lib/money';

import type { AccountSummary } from '../use-finance-data';
import { AccountActions } from './account-actions';
import {
  accountDetail,
  accountHref,
  accountTrend,
  type BalancesByAccount,
  displayedBalance,
  isLiability,
} from './accounts-figures';

export function AccountRow({
  account,
  balances,
  paymentAccountId,
}: {
  account: AccountSummary;
  balances: BalancesByAccount;
  paymentAccountId?: string;
}) {
  const { color, icon: TypeIcon } = accountTypeStyle(account.type);
  const trend = accountTrend(account, balances);

  return (
    <li className="account-row">
      <Link className="account-row__link" href={accountHref(account.id)}>
        <Avatar color={color} shape="square">
          <TypeIcon aria-hidden />
        </Avatar>
        <span className="account-row__text">
          <span className="account-row__name">
            {account.name}
            {account.archivedAt && <Badge tone="neutral">Archived</Badge>}
          </span>
          <span className="account-row__detail">{accountDetail(account)}</span>
        </span>
        <span className="account-row__trend">
          <Sparkline
            color={color}
            label={`${account.name} balance over the last ${trend.length} months`}
            points={trend}
          />
        </span>
        <span className="account-row__balance">
          {formatMoney(displayedBalance(account, account.balanceMinor), account.currency)}
          {isLiability(account) && <span className="account-row__owed">owed</span>}
        </span>
      </Link>
      <div className="account-row__actions">
        <AccountActions account={account} paymentAccountId={paymentAccountId} />
      </div>
    </li>
  );
}
