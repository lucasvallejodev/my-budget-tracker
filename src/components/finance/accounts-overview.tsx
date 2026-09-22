'use client';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useAccounts } from './use-finance-data';
import { Panel, PageHeading, EmptyState, LinkedAccount, StatusBadge } from './blocks';
import { Button } from '../primitives/button';
import { Amount } from '../money/amount';
import CreateAccountDialog from '@/app/(main)/_components/create-account-dialog';
import { accountGroups, accountTypeLabel } from '@/constants/account';
import s from './finance.module.scss';

export function AccountsOverview() {
  const [showArchived, setShowArchived] = useState(false);
  const accounts = useAccounts(showArchived);
  const rows = (accounts.data ?? []).filter(a => showArchived || !a.archivedAt);
  return (
    <div className={s.page}>
      <PageHeading
        title="Accounts"
        description="Your accounts and current balances, grouped by type. Each account keeps its own currency."
        actions={
          <>
            <Button variant="outline" onClick={() => setShowArchived(v => !v)}>
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
      {accounts.isPending ? (
        <p role="status">Loading accounts…</p>
      ) : accounts.isError ? (
        <EmptyState
          title="Could not load accounts"
          action={<Button onClick={() => void accounts.refetch()}>Try again</Button>}
        />
      ) : !rows.length ? (
        <EmptyState
          title="No accounts yet"
          description="Create an account to start recording transactions."
        />
      ) : (
        accountGroups.map(group => {
          const members = rows.filter(a => (group.types as string[]).includes(a.type));
          if (!members.length) return null;
          return (
            <Panel key={group.label} title={group.label}>
              {members.map(a => (
                <LinkedAccount
                  key={a.id}
                  name={a.name}
                  detail={`${a.institution || accountTypeLabel(a.type)} · ${a.currency}`}
                  actions={
                    <div className={s.actions}>
                      {a.archivedAt && <StatusBadge tone="neutral">Archived</StatusBadge>}
                      <strong>
                        <Amount
                          amountMinor={a.balanceMinor}
                          currency={a.currency}
                          flipSign={a.classification === 'liability'}
                        />
                      </strong>
                      {a.classification === 'liability' && <span className={s.muted}>owed</span>}
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/accounts/${a.id}`}>View</Link>
                      </Button>
                    </div>
                  }
                />
              ))}
            </Panel>
          );
        })
      )}
    </div>
  );
}
