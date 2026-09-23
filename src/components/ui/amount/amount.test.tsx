import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { formatMoney } from '@/lib/money';

import { Amount } from './amount';

afterEach(cleanup);

describe('Amount', () => {
  it('formats minor units in the account currency', () => {
    render(<Amount amountMinor={-12345} currency="EUR" />);

    expect(screen.getByText(formatMoney(-12345, 'EUR'))).toBeTruthy();
  });

  it('shows the sign when signed and flips liabilities for display', () => {
    render(<Amount amountMinor={-5000} currency="EUR" signed flipSign />);

    expect(screen.getByText(formatMoney(5000, 'EUR', { signDisplay: 'exceptZero' })).tagName).toBe(
      'SPAN'
    );
  });
});
