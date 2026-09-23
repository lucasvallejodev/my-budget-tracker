import { cleanup, render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { afterEach, describe, expect, it } from 'vitest';

import { Form } from '../form';
import { AmountField, DateField } from './form-fields';

afterEach(cleanup);

function AmountForm() {
  const form = useForm({ defaultValues: { amount: '', date: '2026-01-15' } });

  return (
    <Form {...form}>
      <AmountField control={form.control} name="amount" label="Amount" description="Positive" />
      <DateField control={form.control} name="date" description="Booking date" />
    </Form>
  );
}

describe('form fields', () => {
  it('renders a decimal amount input and the chosen date', () => {
    render(<AmountForm />);

    expect(screen.getByLabelText('Amount').getAttribute('inputmode')).toBe('decimal');
    expect(screen.getByLabelText('Date').textContent).toContain('January 15th, 2026');
  });
});
