import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createTemplate } from '@/api/mutations';

import { SaveTemplateDialog } from './save-template-dialog';
import { draftFromSource } from './template-draft';

vi.mock('@/api/mutations', () => ({ createTemplate: vi.fn(async () => ({})) }));

afterEach(cleanup);

describe('draftFromSource', () => {
  it('maps a transfer form onto the template accounts', () => {
    expect(
      draftFromSource({
        amountFrom: '200',
        fromAccountId: 'checking',
        memo: 'Monthly',
        mode: 'transfer',
        toAccountId: 'savings',
      })
    ).toEqual({
      accountId: 'checking',
      amount: '200',
      direction: 'expense',
      kind: 'transfer',
      memo: 'Monthly',
      transferAccountId: 'savings',
    });
  });

  it('keeps the direction of a standard form', () => {
    expect(draftFromSource({ accountId: 'checking', mode: 'income' })).toMatchObject({
      direction: 'income',
      kind: 'standard',
    });
  });
});

describe('SaveTemplateDialog', () => {
  it('requires a name and saves the draft under it', async () => {
    const onOpenChange = vi.fn();

    render(
      <QueryClientProvider client={new QueryClient()}>
        <SaveTemplateDialog
          open
          draft={draftFromSource({
            accountId: 'checking',
            amount: '2.50',
            mode: 'expense',
          })}
          suggestedName=""
          onOpenChange={onOpenChange}
        />
      </QueryClientProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save template' }));
    expect(await screen.findByText('Name is required')).toBeTruthy();

    fireEvent.change(screen.getByRole('textbox', { name: 'Template name' }), {
      target: { value: 'Coffee' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save template' }));

    await waitFor(() =>
      expect(createTemplate).toHaveBeenCalledWith(
        expect.objectContaining({ amount: '2.50', name: 'Coffee' })
      )
    );
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });
});
