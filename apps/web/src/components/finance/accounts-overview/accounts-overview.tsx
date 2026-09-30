'use client';

import { Archive, Plus } from 'lucide-react';
import { useState } from 'react';

import {
  Button,
  Columns,
  EmptyState,
  Page,
  PageHeading,
  QueryContent,
  Stack,
} from '@/components/ui';
import { FALLBACK_CURRENCY } from '@coinkeeper/shared/constants/money';

import { CreateAccountDialog } from '../create-account-dialog';
import { CurrencySwitch, useCurrencyView } from '../currency-switch';
import { netWorthByMonth } from '../net-worth';
import {
  type AccountSummary,
  type BalancePoint,
  currentMonth,
  shiftMonth,
  type Summary,
  useAccounts,
  useBalances,
  useSettings,
  useSummary,
} from '../use-finance-data';
import { AccountGroup } from './account-group';
import {
  accountsDescription,
  balancesByAccount,
  currenciesOf,
  groupAccounts,
  isActive,
} from './accounts-figures';
import { BalanceSummary } from './balance-summary';
import { CurrencyTotals } from './currency-totals';
import { NetWorthTrend } from './net-worth-trend';

const BalanceHistoryMonths = 13;

function AccountsContent({
  accounts,
  balances,
  currency,
  summary,
}: {
  accounts: AccountSummary[];
  balances: BalancePoint[];
  currency: string;
  summary?: Summary;
}) {
  const active = accounts.filter(isActive);
  const byAccount = balancesByAccount(balances);
  const groups = groupAccounts(accounts, byAccount, shiftMonth(currentMonth(), -1));

  const currentMinor = active
    .filter(account => account.currency === currency)
    .reduce((total, account) => total + account.balanceMinor, 0);

  return (
    <Columns>
      <Stack>
        <NetWorthTrend
          currency={currency}
          currentMinor={currentMinor}
          series={netWorthByMonth(balances, currency)}
        />
        {groups.map(group => (
          <AccountGroup key={group.label} accounts={accounts} balances={byAccount} group={group} />
        ))}
      </Stack>
      <Stack>
        <BalanceSummary accounts={active} currency={currency} />
        <CurrencyTotals accounts={active} converted={summary?.converted} />
      </Stack>
    </Columns>
  );
}

export function AccountsOverview() {
  const [showArchived, setShowArchived] = useState(false);
  const accounts = useAccounts(showArchived);
  const summary = useSummary();
  const balances = useBalances(BalanceHistoryMonths);
  const settings = useSettings();
  const rows = (accounts.data ?? []).filter(account => showArchived || isActive(account));
  const active = rows.filter(isActive);
  const currencies = currenciesOf(active);
  const primary = settings.data?.primaryCurrency ?? FALLBACK_CURRENCY;
  const [currency, setCurrency] = useCurrencyView(currencies, primary);

  return (
    <Page>
      <PageHeading
        title="Accounts"
        description={accountsDescription(active)}
        actions={
          <>
            <CurrencySwitch
              currencies={currencies}
              primary={primary}
              value={currency}
              onChange={setCurrency}
            />
            <Button variant="outline" onClick={() => setShowArchived(visible => !visible)}>
              <Archive aria-hidden />
              {showArchived ? 'Hide archived' : 'Show archived'}
            </Button>
            <CreateAccountDialog
              trigger={
                <Button>
                  <Plus aria-hidden />
                  New account
                </Button>
              }
            />
          </>
        }
      />
      <QueryContent
        pending={accounts.isPending}
        error={accounts.isError}
        loading="Loading accounts…"
        errorTitle="Could not load accounts"
        onRetry={() => void accounts.refetch()}
        empty={
          !rows.length && (
            <EmptyState
              title="No accounts yet"
              description="Create an account to start recording transactions."
            />
          )
        }
      >
        {() => (
          <AccountsContent
            accounts={rows}
            balances={balances.data ?? []}
            currency={currency}
            summary={summary.data}
          />
        )}
      </QueryContent>
    </Page>
  );
}
