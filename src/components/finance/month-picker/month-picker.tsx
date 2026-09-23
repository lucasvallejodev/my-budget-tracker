import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button, Cluster } from '@/components/ui';

import { currentMonth, monthLabel, shiftMonth } from '../use-finance-data';

export function MonthPicker({
  month,
  onChange,
}: {
  month: string;
  onChange: (month: string) => void;
}) {
  return (
    <Cluster role="group" aria-label="Month">
      <Button
        variant="outline"
        size="icon"
        aria-label="Previous month"
        onClick={() => onChange(shiftMonth(month, -1))}
      >
        <ChevronLeft />
      </Button>
      <strong aria-live="polite">{monthLabel(month)}</strong>
      <Button
        variant="outline"
        size="icon"
        aria-label="Next month"
        disabled={month >= currentMonth()}
        onClick={() => onChange(shiftMonth(month, 1))}
      >
        <ChevronRight />
      </Button>
    </Cluster>
  );
}
