import { ReactNode } from 'react';
import { Panel, money } from '../finance/blocks';
export default function ExpenseCategory({
  icon,
  name,
  total,
  children,
}: {
  icon: ReactNode;
  name: string;
  total: number;
  children?: ReactNode;
}) {
  return (
    <Panel title={name} description={money(total)} action={icon}>
      {children}
    </Panel>
  );
}
