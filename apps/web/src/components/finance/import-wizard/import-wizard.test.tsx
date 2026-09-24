import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Preview } from '@coinkeeper/shared/schema/imports';

import { type AccountSummary, type CategoryTree, QueryKeys } from '../use-finance-data';
import { ImportWizard } from './import-wizard';

const preview: Preview = {
  accountId: 'a-checking',
  counts: {
    duplicate: 1,
    invalid: 0,
    matched: 0,
    new: 1,
  },
  currency: 'EUR',
  rows: [
    {
      amountMinor: -1250,
      date: '2026-09-01',
      importId: 'imp-1',
      index: 0,
      memo: '',
      payee: 'MERCADONA',
      status: 'new',
      suggestedBy: 'rule',
      suggestedCategoryId: 'c-groceries',
    },
    {
      amountMinor: -300,
      date: '2026-09-02',
      importId: 'imp-2',
      index: 1,
      memo: '',
      payee: 'COFFEE SHOP',
      status: 'duplicate',
      suggestedBy: null,
      suggestedCategoryId: null,
    },
  ],
};

vi.mock('@/components/finance/account-picker', () => ({
  AccountPicker: ({ onChange, value }: { onChange?: (value: string) => void; value?: string }) => (
    <select aria-label="Account" value={value} onChange={event => onChange?.(event.target.value)}>
      <option value="">Select accounts</option>
      <option value="a-checking">Main checking · EUR</option>
    </select>
  ),
}));

vi.mock('@/app/(main)/actions', () => ({
  commitImportAction: vi.fn(async () => ({
    inserted: 1,
    insertedIds: ['t1'],
    matched: 0,
    suggestions: [
      {
        amountMinor: 1250,
        currency: 'EUR',
        date: '2026-09-01',
        inAccount: 'Savings',
        inId: 't2',
        outAccount: 'Main checking',
        outId: 't1',
      },
    ],
  })),
  createAccountAction: vi.fn(async () => ({})),
  linkTransferAction: vi.fn(async () => ({})),
  previewImportAction: vi.fn(async () => preview),
  updateAccountAction: vi.fn(async () => ({})),
}));

const account: AccountSummary = {
  accountNumber: null,
  archivedAt: null,
  balanceMinor: 0,
  classification: 'asset',
  color: null,
  countsInSpending: true,
  currency: 'EUR',
  icon: null,
  id: 'a-checking',
  institution: null,
  name: 'Main checking',
  notes: null,
  transactionCount: 0,
  type: 'checking',
};

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

const csv = 'Date,Description,Amount\n2026-09-01,MERCADONA,-12.50\n2026-09-02,COFFEE SHOP,-3.00\n';

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
  Element.prototype.scrollIntoView ??= () => {};
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderWizard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  client.setQueryData([...QueryKeys.accounts, false], [account]);
  client.setQueryData([...QueryKeys.categories, false], categories);
  client.setQueryData(QueryKeys.currencies, []);
  client.setQueryData(QueryKeys.settings, { primaryCurrency: 'EUR', showConvertedTotals: false });

  return render(
    <QueryClientProvider client={client}>
      <ImportWizard />
    </QueryClientProvider>
  );
}

function uploadCsv() {
  const file = new File([csv], 'bank.csv', { type: 'text/csv' });

  if (typeof file.text !== 'function') {
    Object.defineProperty(file, 'text', { value: async () => csv });
  }

  fireEvent.change(screen.getByLabelText('CSV file'), { target: { files: [file] } });
}

function chooseAccount() {
  fireEvent.change(screen.getByRole('combobox', { name: 'Account' }), {
    target: { value: 'a-checking' },
  });
}

describe('ImportWizard', () => {
  it('renders the first step and hides the column step until a file is chosen', () => {
    renderWizard();
    expect(screen.getByRole('heading', { name: 'Import transactions' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: '1 · Account and file' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: '2 · Columns' })).toBeNull();
  });

  it('guesses the column mapping from the CSV headers', async () => {
    renderWizard();
    uploadCsv();
    expect(await screen.findByText('bank.csv · 3 columns')).toBeTruthy();
    expect(screen.getByRole('heading', { name: '2 · Columns' })).toBeTruthy();
    expect(screen.getByRole('combobox', { name: 'Date column' }).textContent).toContain('Date');
    expect(screen.getByRole('combobox', { name: 'Amount column' }).textContent).toContain('Amount');
    expect(screen.getByRole('combobox', { name: 'Payee column' }).textContent).toContain(
      'Description'
    );
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Preview' }).disabled).toBe(true);
  });

  it('previews, imports and offers transfer links', async () => {
    const actions = await import('@/app/(main)/actions');

    renderWizard();
    uploadCsv();
    await screen.findByRole('heading', { name: '2 · Columns' });
    chooseAccount();
    await waitFor(() =>
      expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Preview' }).disabled).toBe(
        false
      )
    );
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
    await waitFor(() =>
      expect(actions.previewImportAction).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: 'a-checking',
          csv,
          mapping: expect.objectContaining({
            amount: 'Amount',
            date: 'Date',
            payee: 'Description',
          }),
        })
      )
    );
    expect(await screen.findByRole('heading', { name: '3 · Preview' })).toBeTruthy();
    expect(screen.getByText('MERCADONA')).toBeTruthy();
    expect(screen.getByText('Groceries (rule)')).toBeTruthy();
    expect(screen.getByText('Already imported')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Import 1 new' }));
    await waitFor(() => expect(actions.commitImportAction).toHaveBeenCalledWith(preview));
    expect(await screen.findByRole('heading', { name: 'Done' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Main checking → Savings' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Link as transfer' }));
    await waitFor(() => expect(actions.linkTransferAction).toHaveBeenCalledWith('t1', 't2'));
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Main checking → Savings' })).toBeNull()
    );
  });
});
