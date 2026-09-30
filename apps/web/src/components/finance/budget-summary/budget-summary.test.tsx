import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { formatMoney } from '@coinkeeper/shared/lib/money';

import { budgetFigures } from '../budget-status';
import type { BudgetRow } from '../use-finance-data';
import { BudgetSummary, monthTotals, summaryTag } from './budget-summary';

afterEach(cleanup);

const format = (value: number) => formatMoney(value, 'EUR');

const row = (spentMinor: number, amountMinor: number) =>
  ({
    amountMinor,
    month: '2026-09-01',
    spentMinor,
  }) as BudgetRow;

const Today = '2026-09-28';

const figures = [
  budgetFigures(row(35614, 35000), Today),
  budgetFigures(row(1448, 1500), Today),
  budgetFigures(row(38651, 48500), Today),
];

describe('BudgetSummary', () => {
  it('leads with what is left, the month bar and four labelled figures', () => {
    render(<BudgetSummary figures={figures} format={format} month="2026-09" today={Today} />);

    expect(screen.getByText('Left to spend in September')).toBeTruthy();
    expect(screen.getAllByText('€92.87')).toHaveLength(2);
    expect(screen.getByText('of €850.00')).toBeTruthy();
    expect(screen.getByText('Today · 28 of 30 days')).toBeTruthy();
    expect(screen.getByText('3 categories')).toBeTruthy();
    expect(screen.getByText('By 30 Sep')).toBeTruthy();
  });

  it('counts budgets per status', () => {
    render(<BudgetSummary figures={figures} format={format} month="2026-09" today={Today} />);

    expect(screen.getByText('Over budget').previousElementSibling?.textContent).toBe('1');
    expect(screen.getByText('Spending too fast').previousElementSibling?.textContent).toBe('1');
    expect(screen.getByText('On track').previousElementSibling?.textContent).toBe('1');
  });

  it('tags the month with the worst news first', () => {
    const onTrack = [budgetFigures(row(100, 35000), Today)];

    expect(summaryTag(monthTotals(figures, '2026-09', Today), figures)).toEqual({
      label: '1 over budget',
      tone: 'warning',
    });
    expect(summaryTag(monthTotals(onTrack, '2026-09', Today), onTrack).label).toBe('On pace');

    const over = [budgetFigures(row(900, 500), Today)];

    expect(summaryTag(monthTotals(over, '2026-09', Today), over).label).toBe('Over budget');

    const closed = [budgetFigures(row(100, 500), '2026-10-05')];

    expect(summaryTag(monthTotals(closed, '2026-09', '2026-10-05'), closed)).toEqual({
      label: 'Within budget',
      tone: 'success',
    });
  });

  it('closes a past month without a projection', () => {
    const totals = monthTotals(figures, '2026-09', '2026-10-05');

    expect(totals.pace.isCurrent).toBe(false);

    render(<BudgetSummary figures={figures} format={format} month="2026-09" today="2026-10-05" />);

    expect(screen.getByText('Month closed')).toBeTruthy();
    expect(screen.queryByText(/^By /)).toBeNull();
  });
});
