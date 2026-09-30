import './budgets-to-watch.scss';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { Badge, Button, Panel } from '@/components/ui';

import { BudgetLine } from '../budget-line';
import type { BudgetFigures } from '../budget-status';

export function BudgetsToWatch({
  figures,
  format,
}: {
  figures: BudgetFigures[];
  format: (value: number) => string;
}) {
  const watch = figures.filter(item => item.state !== 'ok');
  const fine = figures.filter(item => item.state === 'ok');

  return (
    <Panel
      title="Budgets to watch"
      description={`${watch.length} of ${figures.length} need attention`}
      action={
        <Button asChild variant="ghost" size="sm">
          <Link href="/budgets">
            All budgets <ArrowRight aria-hidden />
          </Link>
        </Button>
      }
    >
      <ul className="budgets-to-watch__list">
        {watch.map(item => (
          <BudgetLine key={item.budget.id} compact figures={item} format={format} />
        ))}
      </ul>
      {fine.length > 0 && (
        <p className="budgets-to-watch__fine">
          <Badge>{fine.length}</Badge>
          <span>On track: {fine.map(item => item.budget.categoryName).join(', ')}</span>
        </p>
      )}
    </Panel>
  );
}
