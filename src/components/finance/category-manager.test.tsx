import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CategoryManager } from './category-manager';
import type { CategoryTree } from './use-finance-data';

vi.mock('@/app/(main)/actions', () => ({
  archiveCategoryAction: vi.fn(async () => {}),
  archiveCategoryGroupAction: vi.fn(async () => {}),
  createCategoryAction: vi.fn(async () => ({})),
  createCategoryGroupAction: vi.fn(async () => ({})),
  reorderCategoriesAction: vi.fn(async () => {}),
  reorderCategoryGroupsAction: vi.fn(async () => {}),
  restoreCategoryAction: vi.fn(async () => {}),
  updateCategoryAction: vi.fn(async () => ({})),
  updateCategoryGroupAction: vi.fn(async () => ({})),
}));

const tree: CategoryTree[] = [
  {
    archivedAt: null,
    categories: [
      {
        archivedAt: null,
        icon: 'Banknote',
        id: 'c-salary',
        name: 'Salary',
        sortOrder: 0,
        transactionCount: 2,
      },
    ],
    color: '#16A34A',
    id: 'g-income',
    isSystem: true,
    kind: 'income',
    name: 'Income',
    sortOrder: 0,
  },
  {
    archivedAt: null,
    categories: [
      {
        archivedAt: null,
        icon: 'ShoppingCart',
        id: 'c-groceries',
        name: 'Groceries',
        sortOrder: 0,
        transactionCount: 5,
      },
      {
        archivedAt: null,
        icon: 'Coffee',
        id: 'c-coffee',
        name: 'Coffee',
        sortOrder: 1,
        transactionCount: 0,
      },
      {
        archivedAt: '2026-01-01',
        icon: 'Pizza',
        id: 'c-old',
        name: 'Old snacks',
        sortOrder: 2,
        transactionCount: 1,
      },
    ],
    color: '#DC2626',
    id: 'g-food',
    isSystem: false,
    kind: 'expense',
    name: 'Food & Dining',
    sortOrder: 1,
  },
];

afterEach(cleanup);

function renderManager() {
  const client = new QueryClient();

  client.setQueryData(['categories', true], tree);

  return render(
    <QueryClientProvider client={client}>
      <CategoryManager />
    </QueryClientProvider>
  );
}

describe('CategoryManager', () => {
  it('renders groups with their categories and hides the system group archive action', () => {
    renderManager();
    expect(screen.getByText('Income')).toBeTruthy();
    expect(screen.getByText('Groceries')).toBeTruthy();
    expect(screen.getByText('5 transactions')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Archive group Income' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Archive group Food & Dining' })).toBeTruthy();
    expect(screen.queryByText('Old snacks')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Show archived' }));
    expect(screen.getByText('Old snacks')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Restore/ })).toBeTruthy();
  });

  it('offers a destination when archiving a category that has transactions', async () => {
    const actions = await import('@/app/(main)/actions');

    renderManager();
    fireEvent.click(screen.getByRole('button', { name: 'Archive Groceries' }));
    expect(screen.getByRole('dialog', { name: 'Archive Groceries?' })).toBeTruthy();
    expect(screen.getByText(/5 transactions use this category/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Archive' }));
    await vi.waitFor(() =>
      expect(actions.archiveCategoryAction).toHaveBeenCalledWith('c-groceries', undefined)
    );
  });

  it('reorders categories with the arrow buttons', async () => {
    const actions = await import('@/app/(main)/actions');

    renderManager();
    fireEvent.click(screen.getByRole('button', { name: 'Move Coffee up' }));
    await vi.waitFor(() =>
      expect(actions.reorderCategoriesAction).toHaveBeenCalledWith('g-food', [
        'c-coffee',
        'c-groceries',
      ])
    );
    expect(
      screen.getByRole<HTMLButtonElement>('button', { name: 'Move Groceries up' }).disabled
    ).toBe(true);
  });
});
