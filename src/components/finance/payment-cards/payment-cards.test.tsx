import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { PaymentCards } from './payment-cards';

afterEach(cleanup);

const cards = [
  {
    expires: '12/28',
    id: 'one',
    lastFour: '1111',
    name: 'Alex',
  },
  {
    expires: '01/29',
    id: 'two',
    lastFour: '2222',
    name: 'Alex',
  },
];

describe('PaymentCards', () => {
  it('pages through the cards', () => {
    render(<PaymentCards cards={cards} />);

    fireEvent.click(screen.getByRole('button', { name: 'Next card' }));

    expect(screen.getByText('•••• •••• •••• 2222')).toBeTruthy();
    expect(screen.getByText('2 / 2')).toBeTruthy();
  });

  it('shows an empty state without cards', () => {
    render(<PaymentCards cards={[]} />);

    expect(screen.getByText('No cards added')).toBeTruthy();
  });
});
