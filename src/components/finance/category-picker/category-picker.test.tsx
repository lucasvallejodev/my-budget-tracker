import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

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
  it('picks a category from the dialog', () => {
    const client = new QueryClient();
    const onChange = vi.fn();

    client.setQueryData([...QueryKeys.categories, false], tree);
    render(
      <QueryClientProvider client={client}>
        <CategoryPicker onChange={onChange} />
      </QueryClientProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /No category/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Groceries' }));

    expect(onChange).toHaveBeenCalledWith('food');
  });
});
