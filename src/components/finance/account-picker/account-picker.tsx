'use client';

import { EntityPicker, EntityPickerProps } from '@/components/ui';

import { CreateAccountDialog } from '../create-account-dialog';
import { useAccounts } from '../use-finance-data';

export function AccountPicker(props: EntityPickerProps) {
  const query = useAccounts();

  return (
    <EntityPicker
      {...props}
      label="accounts"
      items={(query.data ?? []).map(account => ({
        id: account.id,
        name: `${account.name} · ${account.currency}`,
      }))}
      pending={query.isPending}
      error={query.isError}
      create={(onCreated, dialogProps) => (
        <CreateAccountDialog {...dialogProps} onSuccessCallback={onCreated} />
      )}
    />
  );
}
