'use client';

import { CashFlowChart } from '../finance/charts';
import { SampleCashFlow } from '../finance/sample-data';

export default function ExpenseChart() {
  return <CashFlowChart data={SampleCashFlow} />;
}
