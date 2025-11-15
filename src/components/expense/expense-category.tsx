import { ReactNode } from 'react';

interface ExpenseCategoryProps {
  icon: ReactNode;
  name: string;
  total: number;
  children?: ReactNode;
}

export default function ExpenseCategory({ icon, name, total, children }: ExpenseCategoryProps) {
  return (
    <div className="flex flex-col p-5 pb-6 gap-2.5 rounded-[18px] border border-neutral-300 bg-neutral-0 max-w-[600px]">
      <div className="flex justify-between items-center w-full">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 relative">{icon}</div>
          <div className="text-base text-neutral-1000 leading-7">{name}</div>
        </div>
        <div className="text-base text-neutral-800 leading-7">${total}</div>
      </div>

      {children && <div className="flex flex-col gap-7 mt-5">{children}</div>}
    </div>
  );
}
