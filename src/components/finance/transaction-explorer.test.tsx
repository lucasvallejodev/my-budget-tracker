import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Button } from '../primitives/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '../primitives/dialog';
import { SampleTransactions } from './sample-data';
import { TransactionExplorer } from './transaction-explorer';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function renderExplorer() {
  const client = new QueryClient();

  return render(
    <QueryClientProvider client={client}>
      <TransactionExplorer transactions={SampleTransactions} />
    </QueryClientProvider>
  );
}

describe('Finance controls', () => {
  it('filters transactions and resets pagination', () => {
    renderExplorer();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Page 2 of 2')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'Salary' } });
    expect(screen.getByText('Page 1 of 1')).toBeTruthy();
    expect(screen.getAllByText('Salary Payment')).toHaveLength(3);
    expect(screen.queryAllByRole('row').some(row => row.textContent?.includes('Groceries'))).toBe(
      false
    );
    fireEvent.change(screen.getByLabelText('Type'), { target: { value: 'EXPENSE' } });
    expect(screen.getByText('No transactions found')).toBeTruthy();
  });
  it('combines date and status filters and formats signed amounts', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 8, 5));
    renderExplorer();
    fireEvent.click(screen.getByLabelText('From'));
    fireEvent.click(screen.getByRole('button', { name: /Sunday, September 27th, 2026/ }));
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'cleared' } });
    expect(screen.queryAllByRole('row').some(row => row.textContent?.includes('Groceries'))).toBe(
      true
    );
    expect(screen.queryByText('Salary Payment')).toBeNull();
    expect(screen.getByText('-$39.00')).toBeTruthy();
  });
  it('retains Radix dialog Escape dismissal and accessible naming', () => {
    render(
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open test dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Test dialog</DialogTitle>
          <Button>Inside</Button>
        </DialogContent>
      </Dialog>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Open test dialog' }));
    expect(screen.getByRole('dialog', { name: 'Test dialog' })).toBeTruthy();
    fireEvent.keyDown(document.activeElement ?? document.body, { code: 'Escape', key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('does not submit forms from incidental buttons', () => {
    render(
      <form>
        <Button>Choose category</Button>
      </form>
    );
    expect(screen.getByRole('button').getAttribute('type')).toBe('button');
  });
});
