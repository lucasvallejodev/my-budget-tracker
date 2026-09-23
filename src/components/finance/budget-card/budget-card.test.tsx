import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { BudgetRow } from '../use-finance-data';
import { BudgetCard } from './budget-card';
import { budgetStatus } from './budget-status';

afterEach(cleanup);

const budget = {
  amountMinor: 10000,
  categoryId: 'food',
  categoryName: 'Food',
  color: '#DC2626',
  currency: 'EUR',
  groupName: 'Living',
  icon: 'Utensils',
  id: 'b1',
  month: '2026-01',
  spentMinor: 9000,
} as BudgetRow;

describe('budgetStatus', () => {
  it('grades the share of the budget spent', () => {
    expect(budgetStatus(0.5)).toEqual({ label: 'On track', tone: 'success' });
    expect(budgetStatus(0.8)).toEqual({ label: 'Near limit', tone: 'warning' });
    expect(budgetStatus(1)).toEqual({ label: 'Exceeded', tone: 'danger' });
  });
});

describe('BudgetCard', () => {
  it('shows the status and wires the actions', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<BudgetCard budget={budget} format={String} onEdit={onEdit} onDelete={onDelete} />);

    expect(screen.getByText('Near limit')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'View transactions' }).getAttribute('href')).toBe(
      '/transactions?q=Food'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onEdit).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledOnce();
  });
});
