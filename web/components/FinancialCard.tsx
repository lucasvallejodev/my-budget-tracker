import { formatCurrency } from "@/utils/format";
import { Card, ProgressCircle } from "./ui";
import { TrendIcon } from "./icons";

type NetWorthCardProps = {
  amount: number;
  change: number;
  period: string;
}

const FinancialCard = ({ amount, change, period }: NetWorthCardProps) => {
  const trend = change >= 0 ? 'up' : 'down';

  return (
    <Card>
      <div className="flex items-center mb-6">
        <ProgressCircle progress={change} />
        <h2 className="text-2xl font-medium">Net Worth</h2>
      </div>
      <div className="mb-4">
        <p className="text-5xl font-light">{formatCurrency(amount)}</p>
      </div>
      <div className="flex items-center">
        <p className="mr-3">{period}</p>
        <p className={`flex items-center ${change >= 0 ? 'text-green' : 'text-red-500'}`}>
          {trend === 'up' ? '+' : ''}{formatCurrency(change, { fractionDigits: 0 })}
          <TrendIcon trend={trend} />
        </p>
      </div>
    </Card>
  );
};

export default FinancialCard;