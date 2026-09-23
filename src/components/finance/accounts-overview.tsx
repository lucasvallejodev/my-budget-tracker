'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import CreateAccountDialog from '@/app/(main)/_components/create-account-dialog';
import { AccountGroups, accountTypeLabel } from '@/constants/account';

import { Amount } from '../money/amount';
import { Button } from '../primitives/button';
import { EmptyState, LinkedAccount, PageHeading, Panel, QueryContent, StatusBadge } from './blocks';
import styles from './finance.module.scss';
import { useAccounts } from './use-finance-data';

export function AccountsOverview() {
  const [showArchived, setShowArchived] = useState(false);
  const accounts = useAccounts(showArchived);
  const rows = (accounts.data ?? []).filter(account => showArchived || !account.archivedAt);

  return (
    <div className={styles.page}>
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
                    actions={
                      <div className={styles.actions}>
                        {account.archivedAt && <StatusBadge tone="neutral">Archived</StatusBadge>}
                        <strong>
                          <Amount
                            amountMinor={account.balanceMinor}
                            currency={account.currency}
                            flipSign={account.classification === 'liability'}
                          />
                        </strong>
                        {account.classification === 'liability' && (
                          <span className={styles.muted}>owed</span>
                        )}
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/accounts/${account.id}`}>View</Link>
                        </Button>
                      </div>
                    }
                  />
                ))}
              </Panel>
            );
          })
        }
      </QueryContent>
    </div>
  );
}
