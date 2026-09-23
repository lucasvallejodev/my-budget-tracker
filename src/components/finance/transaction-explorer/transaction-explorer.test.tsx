import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Button, Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui';

import { SampleTransactions } from '../sample-data';
import { TransactionExplorer } from './transaction-explorer';

Element.prototype.scrollIntoView = vi.fn();

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function chooseOption(label: string, option: string) {
  fireEvent.keyDown(screen.getByRole('combobox', { name: label }), { key: 'Enter' });
  fireEvent.click(screen.getByRole('option', { name: option }));
}

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
    chooseOption('Type', 'Expense');
    expect(screen.getByText('No transactions found')).toBeTruthy();
  });
  it('combines date and status filters and formats signed amounts', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 8, 5));
    renderExplorer();
    fireEvent.click(screen.getByLabelText('From'));
    fireEvent.click(screen.getByRole('button', { name: /Sunday, September 27th, 2026/ }));
    chooseOption('Status', 'Cleared');
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
