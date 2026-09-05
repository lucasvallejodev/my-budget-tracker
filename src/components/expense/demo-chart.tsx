'use client';
import { CashFlowChart } from '../finance/charts';
import { sampleCashFlow } from '../finance/sample-data';
export default function ExpenseChart() {
  return <CashFlowChart data={sampleCashFlow} />;
}
