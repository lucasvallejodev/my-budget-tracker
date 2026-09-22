import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
    id: 'g-income',
    name: 'Income',
    kind: 'income',
    color: '#16A34A',
    sortOrder: 0,
    isSystem: true,
    archivedAt: null,
    categories: [
      {
        id: 'c-salary',
        name: 'Salary',
        icon: 'Banknote',
        sortOrder: 0,
        archivedAt: null,
        transactionCount: 2,
      },
    ],
  },
  {
    id: 'g-food',
    name: 'Food & Dining',
    kind: 'expense',
    color: '#DC2626',
    sortOrder: 1,
    isSystem: false,
    archivedAt: null,
    categories: [
      {
        id: 'c-groceries',
        name: 'Groceries',
        icon: 'ShoppingCart',
        sortOrder: 0,
        archivedAt: null,
        transactionCount: 5,
      },
      {
        id: 'c-coffee',
        name: 'Coffee',
        icon: 'Coffee',
        sortOrder: 1,
        archivedAt: null,
        transactionCount: 0,
      },
      {
        id: 'c-old',
        name: 'Old snacks',
        icon: 'Pizza',
        sortOrder: 2,
        archivedAt: '2026-01-01',
        transactionCount: 1,
      },
    ],
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
      (screen.getByRole('button', { name: 'Move Groceries up' }) as HTMLButtonElement).disabled
    ).toBe(true);
  });
});
