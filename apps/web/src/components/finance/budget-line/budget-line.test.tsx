import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { formatMoney } from '@coinkeeper/shared/lib/money';

import { budgetFigures } from '../budget-status';
import type { BudgetRow as Row } from '../use-finance-data';
import { allowanceLabel, BudgetLine, leftLabel } from './budget-line';

afterEach(cleanup);

const format = (value: number) => formatMoney(value, 'EUR');

const groceries = (spentMinor: number) =>
  ({
    amountMinor: 35000,
    categoryName: 'Groceries',
    color: '#DC2626',
    groupName: 'Food & Dining',
    icon: 'ShoppingCart',
    month: '2026-09-01',
    spentMinor,
  }) as Row;

describe('BudgetLine', () => {
  it('says what is over in red with the bar coloured by status', () => {
    const { container } = render(
      <ul>
        <BudgetLine figures={budgetFigures(groceries(35614), '2026-09-28')} format={format} />
      </ul>
    );

    expect(screen.getByText('€6.14 over').className).toContain('budget-line__amount--over');
    expect(screen.getByText('Nothing left this month')).toBeTruthy();
    expect(container.querySelector('.progress-bar--danger')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Groceries' }).getAttribute('href')).toBe(
      '/transactions?month=2026-09&q=Groceries'
    );
  });

  it('names the status in words, not only by colour', () => {
    const { rerender } = render(
      <ul>
        <BudgetLine figures={budgetFigures(groceries(30000), '2026-09-10')} format={format} />
      </ul>
    );

    expect(screen.getByText('Spending too fast')).toBeTruthy();
    expect(
      screen.getByRole('progressbar', {
        name: 'Groceries: 86% of the budget spent, spending too fast',
      })
    ).toBeTruthy();

    rerender(
      <ul>
        <BudgetLine
          figures={budgetFigures(groceries(30000), '2026-09-10')}
          format={format}
          showStatus={false}
        />
      </ul>
    );

    expect(screen.queryByText('Spending too fast')).toBeNull();

    rerender(
      <ul>
        <BudgetLine
          compact
          figures={budgetFigures(groceries(30000), '2026-09-10')}
          format={format}
          showStatus={false}
        />
      </ul>
    );

    expect(screen.getByText('Spending too fast').className).toBe('budget-line__meta');
  });

  it('offers edit, transactions and delete in the row menu', () => {
    const onEdit = vi.fn();

    render(
      <ul>
        <BudgetLine
          figures={budgetFigures(groceries(10000), '2026-09-28')}
          format={format}
          onEdit={onEdit}
          onDelete={vi.fn()}
        />
      </ul>
    );

    fireEvent.pointerDown(
      screen.getByRole('button', { name: 'Actions for the Groceries budget' }),
      {
        button: 0,
        ctrlKey: false,
      }
    );
    fireEvent.click(screen.getByRole('menuitem', { name: 'Edit budget' }));

    expect(onEdit).toHaveBeenCalled();
  });

  it('writes what is left and the daily allowance', () => {
    const figures = budgetFigures(groceries(10000), '2026-09-28');

    expect(leftLabel(figures, format)).toBe('€250.00 left');
    expect(allowanceLabel(figures, format)).toBe('€83.33 a day');
    expect(allowanceLabel(budgetFigures(groceries(10000), '2026-10-02'), format)).toBe('');
  });
});
