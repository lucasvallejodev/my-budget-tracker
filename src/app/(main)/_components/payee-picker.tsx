'use client';

import { EntityPicker, EntityPickerProps } from '@/components/primitives/entity-picker';
import { usePayees } from '@/components/finance/use-finance-data';
import CreatePayeeDialog from './create-payee-dialog';

export default function PayeePicker(props: EntityPickerProps) {
  const query = usePayees();

  return (
    <EntityPicker
      {...props}
      label="payees"
      items={query.data ?? []}
      pending={query.isPending}
      error={query.isError}
      create={(onCreated, dialogProps) => (
        <CreatePayeeDialog {...dialogProps} onSuccessCallback={onCreated} />
      )}
    />
  );
}
