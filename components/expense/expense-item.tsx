interface ExpenseItemProps {
  name: string;
  amount: number;
  budget: number;
  leftAmount: number;
  color: string;
}

export default function ExpenseItem({ name, amount, budget, leftAmount, color }: ExpenseItemProps) {
  const percentage = (amount / budget) * 100;

  return (
    <div className="flex items-start gap-6 w-full">
      <div className="flex flex-col items-start gap-3 flex-1">
        <div className="text-base font-bold text-neutral-1000 leading-7">
          {name}
        </div>
        <div className="w-full h-1 bg-neutral-400 rounded-[10px] relative overflow-hidden">
          <div 
            className="h-full rounded-[10px] transition-all duration-300"
            style={{ 
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: color
            }}
          />
        </div>
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <div className="text-base font-bold text-neutral-1000 leading-7">
          ${amount}
        </div>
        <div className="text-xs text-neutral-800 leading-4">
          Left ${leftAmount}
        </div>
      </div>
    </div>
  );
}
