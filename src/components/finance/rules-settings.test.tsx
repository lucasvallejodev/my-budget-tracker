import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RulesSettings } from './rules-settings';
import { type CategoryTree, QueryKeys, type RuleRow } from './use-finance-data';

const MutationContextArgument = expect.anything();

vi.mock('@/app/(main)/actions', () => ({
  applyRulesAction: vi.fn(async () => ({ updated: 3 })),
  createRuleAction: vi.fn(async () => ({})),
  deleteRuleAction: vi.fn(async () => {}),
}));

const rules: RuleRow[] = [
  {
    categoryId: 'c-groceries',
    categoryName: 'Groceries',
    id: 'r-mercadona',
    name: 'Mercadona',
    pattern: 'MERCADONA',
    priority: 0,
  },
  {
    categoryId: 'c-gone',
    categoryName: null,
    id: 'r-old',
    name: 'Old shop',
    pattern: 'OLDSHOP',
    priority: 1,
  },
];

const categories: CategoryTree[] = [
  {
    archivedAt: null,
    categories: [
      {
        archivedAt: null,
        icon: 'ShoppingCart',
        id: 'c-groceries',
        name: 'Groceries',
        sortOrder: 0,
        transactionCount: 0,
      },
    ],
    color: '#DC2626',
    id: 'g-food',
    isSystem: false,
    kind: 'expense',
    name: 'Food & Dining',
    sortOrder: 0,
  },
];

afterEach(cleanup);

function renderRules(data: RuleRow[] = rules) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  client.setQueryData(['rules'], data);
  client.setQueryData([...QueryKeys.categories, false], categories);

  return render(
    <QueryClientProvider client={client}>
      <RulesSettings />
    </QueryClientProvider>
  );
}

describe('RulesSettings', () => {
  it('lists rules with their pattern and category', () => {
    renderRules();
    expect(screen.getByRole('heading', { name: 'Mercadona' })).toBeTruthy();
    expect(screen.getByText('contains “MERCADONA” → Groceries')).toBeTruthy();
    expect(screen.getByText('contains “OLDSHOP” → archived category')).toBeTruthy();
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Add rule' }).disabled).toBe(true);
  });

  it('shows an empty state and disables apply when there are no rules', () => {
    renderRules([]);
    expect(screen.getByRole('heading', { name: 'No rules yet' })).toBeTruthy();
    expect(
      screen.getByRole<HTMLButtonElement>('button', { name: 'Apply to uncategorized' }).disabled
    ).toBe(true);
  });

  it('applies rules and deletes a rule through the actions', async () => {
    const actions = await import('@/app/(main)/actions');

    renderRules();
    fireEvent.click(screen.getByRole('button', { name: 'Apply to uncategorized' }));
    await vi.waitFor(() => expect(actions.applyRulesAction).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: 'Delete rule Old shop' }));
    await vi.waitFor(() =>
      expect(actions.deleteRuleAction).toHaveBeenCalledWith('r-old', MutationContextArgument)
    );
  });

  it('creates a rule from the pattern and the picked category', async () => {
    const actions = await import('@/app/(main)/actions');

    renderRules();
    fireEvent.change(screen.getByLabelText('Text to look for'), { target: { value: 'LIDL' } });
    fireEvent.click(screen.getByRole('button', { name: /No category/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Groceries' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add rule' }));
    await vi.waitFor(() =>
      expect(actions.createRuleAction).toHaveBeenCalledWith({
        categoryId: 'c-groceries',
        pattern: 'LIDL',
      })
    );
  });
});
