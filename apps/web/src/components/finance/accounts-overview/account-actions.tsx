'use client';

import './account-actions.scss';

import { useMutation } from '@tanstack/react-query';
import { CreditCard, Ellipsis } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

import { setAccountArchived } from '@/api/mutations';
import { Button, Menu, MenuContent, MenuItem, MenuTrigger } from '@/components/ui';
import { minorToDecimalString } from '@coinkeeper/shared/lib/money';

import { CreateAccountDialog } from '../create-account-dialog';
import { TransactionDialog } from '../transaction-dialog';
import { type AccountSummary, useRefreshFinance } from '../use-finance-data';
import { accountHref, isLiability } from './accounts-figures';

function PayCardDialog({
  account,
  onOpenChange,
  paymentAccountId,
}: {
  account: AccountSummary;
  onOpenChange: (open: boolean) => void;
  paymentAccountId?: string;
}) {
  return (
    <TransactionDialog
      open
      onOpenChange={onOpenChange}
      preset={{
        amountFrom: minorToDecimalString(-account.balanceMinor, account.currency),
        fromAccountId: paymentAccountId ?? '',
        memo: `Payment to ${account.name}`,
        mode: 'transfer',
        toAccountId: account.id,
      }}
    />
  );
}

export function AccountActions({
  account,
  paymentAccountId,
}: {
  account: AccountSummary;
  paymentAccountId?: string;
}) {
  const refresh = useRefreshFinance();
  const [editing, setEditing] = useState(false);
  const [paying, setPaying] = useState(false);
  const archived = !!account.archivedAt;
  const canPay = isLiability(account) && account.balanceMinor < 0 && !archived;

  const archive = useMutation({
    mutationFn: (nextArchived: boolean) => setAccountArchived(account.id, nextArchived),
    onError: (error: Error) => toast.error(error.message),
    onSuccess: async (result, nextArchived) => {
      toast.success(nextArchived ? 'Account archived' : 'Account restored');
      await refresh();
    },
  });

  return (
    <>
      {canPay && (
        <Button
          className="account-actions__pay"
          variant="secondary"
          size="sm"
          onClick={() => setPaying(true)}
        >
          <CreditCard aria-hidden /> Pay card
        </Button>
      )}
      <Menu>
        <MenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Actions for ${account.name}`}>
            <Ellipsis aria-hidden />
          </Button>
        </MenuTrigger>
        <MenuContent align="end">
          <MenuItem asChild>
            <Link href={accountHref(account.id)}>Open account</Link>
          </MenuItem>
          {canPay && <MenuItem onSelect={() => setPaying(true)}>Pay card</MenuItem>}
          <MenuItem onSelect={() => setEditing(true)}>Edit account</MenuItem>
          <MenuItem disabled={archive.isPending} onSelect={() => archive.mutate(!archived)}>
            {archived ? 'Restore account' : 'Archive account'}
          </MenuItem>
        </MenuContent>
      </Menu>
      {paying && (
        <PayCardDialog
          account={account}
          onOpenChange={setPaying}
          paymentAccountId={paymentAccountId}
        />
      )}
      {editing && (
        <CreateAccountDialog open={editing} onOpenChange={setEditing} account={account} />
      )}
    </>
  );
}
