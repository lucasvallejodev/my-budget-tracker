import { FinancialCard } from "../components";

export default function Home() {
  return (
    <div className="flex flex-col gap-4">
      <FinancialCard
        amount={7884.80} 
        change={2593.43} 
        period="90-Day" 
      />
      <FinancialCard
        amount={1486.69} 
        change={-129.43} 
        period="90-Day" 
      />
      <FinancialCard
        amount={3493.43} 
        change={372.43} 
        period="90-Day" 
      />
    </div>
  );
}
