'use client';
import { useQuery } from '@tanstack/react-query';
import { EntityPicker, EntityPickerProps } from '@/components/primitives/entity-picker';
import { fetchFinance } from '@/components/finance/use-finance-data';
import CreatePayeeDialog from './create-payee-dialog';
import { PayeeResponseType } from '../_types/payees';
export default function PayeePicker(props: EntityPickerProps) {
  const query = useQuery({
    queryKey: ['payees'],
    queryFn: () => fetchFinance<PayeeResponseType[]>('/api/payees'),
  });
  return (
    <EntityPicker
      {...props}
      label="payees"
      items={query.data || []}
      pending={query.isPending}
      error={query.isError}
      create={(onCreated, dialogProps) => (
        <CreatePayeeDialog {...dialogProps} onSuccessCallback={onCreated} />
      )}
    />
  );
}
