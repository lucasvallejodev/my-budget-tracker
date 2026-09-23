import { CategoryBudget } from '../finance/blocks';

export default function ExpenseItem({
  name,
  amount,
  budget,
}: {
  name: string;
  amount: number;
  budget: number;
  leftAmount: number;
  color: string;
}) {
  return <CategoryBudget name={name} spent={amount} limit={budget} />;
}
