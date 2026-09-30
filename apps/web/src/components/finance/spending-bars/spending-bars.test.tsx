import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { formatMoney } from '@coinkeeper/shared/lib/money';

import { foldSmallSlices, groupSpendingSlices, hasSpendingIn, SpendingBars } from './spending-bars';

afterEach(cleanup);

const format = (value: number) => formatMoney(value, 'EUR');

const slices = [
  {
    color: '#7C3AED',
    name: 'Housing',
    previousMinor: 120000,
    spentMinor: 120000,
  },
  {
    color: '#DC2626',
    name: 'Food & Dining',
    previousMinor: 60000,
    spentMinor: 54000,
  },
  {
    color: '#0891B2',
    name: 'Bills',
    previousMinor: 10000,
    spentMinor: 12000,
  },
  {
    color: '#EA580C',
    name: 'Transport',
    spentMinor: 5000,
  },
];

describe('SpendingBars', () => {
  it('lists groups largest first with share and change against last month', () => {
    render(<SpendingBars slices={slices} format={format} month="2026-09" comparison="August" />);

    const names = screen.getAllByRole('link').map(link => link.textContent);

    expect(names).toEqual(['Housing', 'Food & Dining', 'Bills', 'Transport']);
    expect(screen.getByText('Same as August')).toBeTruthy();
    expect(screen.getByText('−10%', { exact: false }).className).toBe('spending-bars__change');
    expect(screen.getByText('+20%', { exact: false }).className).toBe(
      'spending-bars__change spending-bars__change--up'
    );
    expect(screen.getByText('None in August')).toBeTruthy();
  });

  it('leaves out the change when there is nothing to compare with', () => {
    render(<SpendingBars slices={slices} format={format} month="2026-09" />);

    expect(screen.queryByText(/August|None in/)).toBeNull();
  });

  it('pairs each group with its amount in the previous period', () => {
    const group = (groupName: string, spentMinor: number, currency = 'EUR') => ({
      color: '#7C3AED',
      currency,
      groupId: groupName,
      groupName,
      spentMinor,
    });

    const paired = groupSpendingSlices(
      [group('Housing', 900), group('Bills', 50), group('Travel', 70, 'USD')],
      [group('Housing', 800), group('Housing', 10, 'USD')],
      'EUR'
    );

    expect(paired.map(slice => [slice.name, slice.previousMinor])).toEqual([
      ['Housing', 800],
      ['Bills', undefined],
    ]);
    expect(hasSpendingIn([group('Housing', 10, 'USD')], 'EUR')).toBe(false);
  });

  it('folds small groups into one row', () => {
    const folded = foldSmallSlices(slices, 2);

    expect(folded.map(bar => bar.name)).toEqual(['Housing', 'Food & Dining', 'Other groups (2)']);
    expect(folded[2].spentMinor).toBe(17000);
    expect(foldSmallSlices(slices, 3)).toHaveLength(4);
  });

  it('says when nothing was spent', () => {
    render(<SpendingBars slices={[]} format={format} month="2026-09" comparison="August" />);

    expect(screen.getByText('No spending yet')).toBeTruthy();
  });
});
