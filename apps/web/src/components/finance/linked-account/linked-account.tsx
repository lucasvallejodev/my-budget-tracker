import { Wallet } from 'lucide-react';
import { ReactNode } from 'react';

import { IconTile, ListRow } from '@/components/ui';

const AccountIconSize = 20;

export function LinkedAccount({
  actions,
  detail,
  name,
}: {
  actions?: ReactNode;
  detail: string;
  name: string;
}) {
  return (
    <ListRow
      title={name}
      description={detail}
      leading={
        <IconTile>
          <Wallet size={AccountIconSize} />
        </IconTile>
      }
    >
      {actions}
    </ListRow>
  );
}
