import './budget-insights.scss';

import { CircleCheck, Info } from 'lucide-react';

import { Panel } from '@/components/ui';

const InsightIconSize = 18;

export function BudgetInsights({ insights }: { insights: string[] }) {
  return (
    <Panel title="Budget Insights">
      <ul className="budget-insights">
        {insights.map((text, index) => (
          <li key={text} className="budget-insights__item">
            {index === 0 ? <Info size={InsightIconSize} /> : <CircleCheck size={InsightIconSize} />}
            {text}
          </li>
        ))}
      </ul>
    </Panel>
  );
}
