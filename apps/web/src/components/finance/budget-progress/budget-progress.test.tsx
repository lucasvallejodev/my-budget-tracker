import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { budgetPace } from '@coinkeeper/shared/lib/budget-pace';
import { calendarPeriod } from '@coinkeeper/shared/lib/periods';

import { BudgetProgress } from './budget-progress';

afterEach(cleanup);

describe('BudgetProgress', () => {
  it('shows the share used and what remains', () => {
    render(<BudgetProgress spent={25} limit={100} format={value => `${value} left`} />);

    expect(screen.getByText('25% used')).toBeTruthy();
    expect(screen.getByText('75 left remaining')).toBeTruthy();
    expect(screen.getByRole('progressbar', { name: 'Budget progress' }).getAttribute('value')).toBe(
      '25'
    );
  });

  it('caps the bar at 100 when over budget', () => {
    render(<BudgetProgress spent={150} limit={100} label="Food" />);

    expect(screen.getByRole('progressbar', { name: 'Food' }).getAttribute('value')).toBe('100');
  });

  it('describes the pace and the daily allowance in the current month', () => {
    const pace = budgetPace({
      limitMinor: 40000,
      period: calendarPeriod('2026-09'),
      spentMinor: 30000,
      today: '2026-09-18',
    });

    render(<BudgetProgress spent={30000} limit={40000} pace={pace} format={String} />);

    expect(
      screen.getByText(
        '6000 ahead of plan · 769 a day for 13 days · projected 50000 of 40000 by the end of the month'
      )
    ).toBeTruthy();
  });

  it('says nothing about pace for a past month', () => {
    const pace = budgetPace({
      limitMinor: 40000,
      period: calendarPeriod('2026-08'),
      spentMinor: 30000,
      today: '2026-09-18',
    });

    render(<BudgetProgress spent={30000} limit={40000} pace={pace} format={String} />);

    expect(screen.queryByText(/ahead of plan/)).toBeNull();
  });
});
