import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type CategoryTree, QueryKeys } from '../use-finance-data';
import { CategoryPicker, flattenCategories } from './category-picker';

afterEach(cleanup);

const tree = [
  {
    archivedAt: null,
    categories: [
      {
        archivedAt: null,
        icon: 'Utensils',
        id: 'food',
        name: 'Groceries',
        transactionCount: 1,
      },
      {
        archivedAt: new Date(),
        icon: 'Bus',
        id: 'old',
        name: 'Old bus',
        transactionCount: 0,
      },
    ],
    color: '#DC2626',
    id: 'living',
    isSystem: false,
    kind: 'expense',
    name: 'Living',
  },
] as unknown as CategoryTree[];

describe('flattenCategories', () => {
  it('drops archived categories and carries the group colour', () => {
    expect(flattenCategories(tree)).toEqual([
      expect.objectContaining({
        color: '#DC2626',
        groupName: 'Living',
        id: 'food',
      }),
    ]);
    expect(flattenCategories(undefined)).toEqual([]);
  });
});

describe('CategoryPicker', () => {
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
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  const renderPicker = (onChange = vi.fn(), suggestedId?: string) => {
    const client = new QueryClient();

    client.setQueryData([...QueryKeys.categories, false], tree);

    return render(
      <QueryClientProvider client={client}>
        <CategoryPicker onChange={onChange} suggestedId={suggestedId} />
      </QueryClientProvider>
    );
  };

  it('filters categories by group name and remembers the pick as recent', () => {
    const onChange = vi.fn();

    renderPicker(onChange);
    fireEvent.click(screen.getByRole('button', { name: 'Category: Choose category' }));
    fireEvent.change(screen.getByLabelText('Search category'), { target: { value: 'liv' } });
    fireEvent.click(screen.getByText('Groceries'));

    expect(onChange).toHaveBeenCalledWith('food');
    expect(localStorage.getItem('coinkeeper-remembered-recent-categories')).toBe('food');
    expect(screen.queryByText('Old bus')).toBeNull();
  });

  it('shows the suggestion first and offers to create a category', () => {
    renderPicker(vi.fn(), 'food');
    fireEvent.click(screen.getByRole('button', { name: 'Category: Choose category' }));

    expect(screen.getByText('Suggested')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Create a category' }).getAttribute('href')).toBe(
      '/settings/categories'
    );
  });
});
