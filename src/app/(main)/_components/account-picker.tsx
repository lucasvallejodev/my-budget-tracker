'use client';
import { useQuery } from '@tanstack/react-query';
import { EntityPicker, EntityPickerProps } from '@/components/primitives/entity-picker';
import { fetchFinance } from '@/components/finance/use-finance-data';
import CreateAccountDialog from './create-account-dialog';
import { AccountResponseType } from '../_types/accounts';
export default function AccountPicker(props: EntityPickerProps) {
  const query = useQuery({
    queryKey: ['accounts'],
    queryFn: () => fetchFinance<AccountResponseType[]>('/api/accounts'),
  });
  return (
    <EntityPicker
      {...props}
      label="accounts"
      items={query.data || []}
      pending={query.isPending}
      error={query.isError}
      create={onCreated => <CreateAccountDialog onSuccessCallback={onCreated} />}
    />
  );
}
