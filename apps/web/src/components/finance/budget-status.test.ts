import { describe, expect, it } from 'vitest';

import { budgetFigures, budgetState, BudgetStates } from './budget-status';
import type { BudgetRow } from './use-finance-data';

const budget = (spentMinor: number, amountMinor = 10000) =>
  ({
    amountMinor,
    month: '2026-09-01',
    spentMinor,
  }) as BudgetRow;

describe('budget status', () => {
  it('follows the pace of the month, with no near-limit state', () => {
    expect(budgetState(10500, 10000, false)).toBe('over');
    expect(budgetState(8000, 10000, true)).toBe('fast');
    expect(budgetState(9000, 10000, false)).toBe('ok');
    expect(BudgetStates.over.label).toBe('Over budget');
    expect(BudgetStates.fast.label).toBe('Spending too fast');
    expect(BudgetStates.ok.label).toBe('On track');
  });

  it('calls 90% spent on the 28th on track', () => {
    expect(budgetFigures(budget(9000), '2026-09-28').state).toBe('ok');
  });

  it('flags a budget whose month-end projection passes the limit', () => {
    const figures = budgetFigures(budget(6000), '2026-09-10');

    expect(figures.state).toBe('fast');
    expect(figures.leftMinor).toBe(4000);
  });

  it('marks spending past the limit as over whatever the date', () => {
    expect(budgetFigures(budget(10001), '2026-09-02').state).toBe('over');
  });
});
