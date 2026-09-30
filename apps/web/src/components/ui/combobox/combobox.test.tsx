import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Combobox, type ComboboxSection, matchesSearch } from './combobox';

const Sections: ComboboxSection[] = [
  {
    heading: 'Suggested',
    hideWhileSearching: true,
    id: 'suggested',
    options: [{ id: 'groceries', label: 'Groceries' }],
  },
  {
    heading: 'Food & Dining',
    id: 'food',
    options: [
      {
        id: 'groceries',
        keywords: ['Food & Dining'],
        label: 'Groceries',
      },
      {
        id: 'coffee',
        keywords: ['Food & Dining'],
        label: 'Coffee',
      },
    ],
  },
  {
    heading: 'Housing',
    id: 'housing',
    options: [
      {
        id: 'rent',
        keywords: ['Housing'],
        label: 'Rent',
      },
    ],
  },
];

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const renderCombobox = (onChange = vi.fn(), value?: string) =>
  render(
    <Combobox
      label="Category"
      placeholder="Choose category"
      clearLabel="Leave uncategorized"
      sections={Sections}
      value={value}
      onChange={onChange}
    />
  );

const open = () =>
  fireEvent.click(screen.getByRole('button', { name: /^Category:/ }), { button: 0 });

describe('Combobox', () => {
  it('names the trigger after its label and value', () => {
    renderCombobox(vi.fn(), 'rent');

    expect(screen.getByRole('button', { name: 'Category: Rent' })).toBeTruthy();
  });

  it('filters by option and section keywords and hides pinned sections while searching', () => {
    renderCombobox();
    open();

    expect(screen.getByText('Suggested')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Search category'), { target: { value: 'food' } });

    expect(screen.queryByText('Suggested')).toBeNull();
    expect(screen.getByText('Coffee')).toBeTruthy();
    expect(screen.queryByText('Rent')).toBeNull();
  });

  it('picks an option and can clear the value', () => {
    const onChange = vi.fn();

    renderCombobox(onChange, 'rent');
    open();
    fireEvent.click(screen.getByText('Coffee'));

    expect(onChange).toHaveBeenLastCalledWith('coffee');

    open();
    fireEvent.click(screen.getByText('Leave uncategorized'));

    expect(onChange).toHaveBeenLastCalledWith(undefined);
  });

  it('matches every search term anywhere in the keywords', () => {
    expect(matchesSearch('gro', ['Groceries', 'Food & Dining'])).toBe(1);
    expect(matchesSearch('food gro', ['Groceries', 'Food & Dining'])).toBe(1);
    expect(matchesSearch('rent', ['Groceries'])).toBe(0);
    expect(matchesSearch('', ['Groceries'])).toBe(1);
  });
});
