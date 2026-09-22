import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TransactionExplorer } from './transaction-explorer';
import { sampleTransactions } from './sample-data';
import { Button } from '../primitives/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '../primitives/dialog';
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
describe('Finance controls', () => {
  it('filters transactions and resets pagination', () => {
    render(<TransactionExplorer transactions={sampleTransactions} />);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Page 2 of 3')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'Salary' } });
    expect(screen.getByText('Page 1 of 1')).toBeTruthy();
    expect(screen.getAllByText('Salary Payment')).toHaveLength(3);
    expect(screen.queryByText('Groceries')).toBeNull();
    fireEvent.change(screen.getByLabelText('Type'), { target: { value: 'EXPENSE' } });
    expect(screen.getByText('No transactions found')).toBeTruthy();
  });
  it('combines date and status filters', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 8, 5));
    render(<TransactionExplorer transactions={sampleTransactions} />);
    fireEvent.click(screen.getByLabelText('From'));
    fireEvent.click(screen.getByRole('button', { name: /Sunday, September 27th, 2026/ }));
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'Completed' } });
    expect(screen.getByText('Groceries')).toBeTruthy();
    expect(screen.queryByText('Salary Payment')).toBeNull();
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
    fireEvent.keyDown(document.activeElement || document.body, { key: 'Escape', code: 'Escape' });
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
