'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import {
  Amount,
  Badge,
  Button,
  Cluster,
  EmptyState,
  Page,
  PageHeading,
  Panel,
  QueryContent,
  Text,
} from '@/components/ui';
import { AccountGroups, accountTypeLabel } from '@/constants/account';

import { CreateAccountDialog } from '../create-account-dialog';
import { LinkedAccount } from '../linked-account';
import { AccountSummary, useAccounts } from '../use-finance-data';

function AccountActions({ account }: { account: AccountSummary }) {
  const isLiability = account.classification === 'liability';

  return (
    <Cluster>
      {account.archivedAt && <Badge tone="neutral">Archived</Badge>}
      <strong>
        <Amount
          amountMinor={account.balanceMinor}
          currency={account.currency}
          flipSign={isLiability}
        />
      </strong>
      {isLiability && (
        <Text as="span" tone="muted">
          owed
        </Text>
      )}
      <Button asChild variant="outline" size="sm">
        <Link href={`/accounts/${account.id}`}>View</Link>
      </Button>
    </Cluster>
  );
}

export function AccountsOverview() {
  const [showArchived, setShowArchived] = useState(false);
  const accounts = useAccounts(showArchived);
  const rows = (accounts.data ?? []).filter(account => showArchived || !account.archivedAt);

  return (
    <Page>
      <PageHeading
        title="Accounts"
        description="Your accounts and current balances, grouped by type. Each account keeps its own currency."
        actions={
          <>
            <Button variant="outline" onClick={() => setShowArchived(visible => !visible)}>
              {showArchived ? 'Hide archived' : 'Show archived'}
            </Button>
            <CreateAccountDialog
              trigger={
                <Button>
                  <Plus />
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
        {() =>
          AccountGroups.map(group => {
            const members = rows.filter(account =>
              (group.types as string[]).includes(account.type)
            );

            if (!members.length) return null;

            return (
              <Panel key={group.label} title={group.label}>
                {members.map(account => (
                  <LinkedAccount
                    key={account.id}
                    name={account.name}
                    detail={`${account.institution || accountTypeLabel(account.type)} · ${account.currency}`}
                    actions={<AccountActions account={account} />}
                  />
                ))}
              </Panel>
            );
          })
        }
      </QueryContent>
    </Page>
  );
}
