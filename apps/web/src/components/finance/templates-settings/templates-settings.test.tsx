import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createTemplate, deleteTemplate, reorderTemplates } from '@/api/mutations';
import type { TemplateRow } from '@coinkeeper/shared/schema/templates';

import { QueryKeys } from '../use-finance-data';
import { TemplatesSettings } from './templates-settings';

vi.mock('@/api/mutations', () => ({
  createTemplate: vi.fn(async () => ({})),
  deleteTemplate: vi.fn(async () => {}),
  reorderTemplates: vi.fn(async () => {}),
  restoreTemplate: vi.fn(async () => ({})),
  updateTemplate: vi.fn(async () => ({})),
}));

const Coffee: TemplateRow = {
  accountId: 'wallet',
  amountMinor: -250,
  categoryId: null,
  currency: 'EUR',
  deletedAt: null,
  direction: 'expense',
  id: 'coffee',
  kind: 'standard',
  lastUsedAt: null,
  memo: '',
  name: 'Coffee',
  payeeId: null,
  sortOrder: 0,
  transferAccountId: null,
  unavailableReason: null,
};

const Rent: TemplateRow = {
  ...Coffee,
  accountId: 'closed',
  amountMinor: null,
  id: 'rent',
  name: 'Rent',
  sortOrder: 1,
  unavailableReason: 'account_archived',
};

const renderSettings = (templates: TemplateRow[]) => {
  const client = new QueryClient();

  client.setQueryData(QueryKeys.templates, templates);
  client.setQueryData(
    [...QueryKeys.accounts, true],
    [
      {
        currency: 'EUR',
        id: 'wallet',
        name: 'Wallet',
      },
      {
        currency: 'EUR',
        id: 'closed',
        name: 'Old bank',
      },
    ]
  );

  return render(
    <QueryClientProvider client={client}>
      <TemplatesSettings />
    </QueryClientProvider>
  );
};

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('TemplatesSettings', () => {
  it('describes each template and flags the unavailable ones', () => {
    renderSettings([Coffee, Rent]);

    expect(screen.getByText('Expense · Wallet · €2.50')).toBeTruthy();
    expect(screen.getByText('Expense · Old bank · amount asked each time')).toBeTruthy();
    expect(screen.getByText('Account archived')).toBeTruthy();
  });

  it('moves a template down and deletes another', async () => {
    renderSettings([Coffee, Rent]);

    expect(screen.getByRole('button', { name: 'Move Coffee up' })).toHaveProperty('disabled', true);

    fireEvent.click(screen.getByRole('button', { name: 'Move Coffee down' }));
    await waitFor(() =>
      expect(reorderTemplates).toHaveBeenCalledWith(['rent', 'coffee'], expect.anything())
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete Rent' }));
    await waitFor(() => expect(deleteTemplate).toHaveBeenCalledWith('rent'));
  });

  it('creates a template from the dialog', async () => {
    renderSettings([]);

    expect(screen.getByText('No templates yet')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'New template' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), {
      target: { value: 'Groceries' },
    });
    fireEvent.click(screen.getByRole('radio', { name: 'Income' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save template' }));

    await waitFor(() =>
      expect(createTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          direction: 'income',
          kind: 'standard',
          name: 'Groceries',
        })
      )
    );
  });
});
