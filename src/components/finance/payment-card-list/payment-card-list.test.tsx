import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { PaymentCardList } from './payment-card-list';

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

describe('PaymentCardList', () => {
  it('moves the primary badge and removes cards', () => {
    render(<PaymentCardList initialCards={cards} />);

    fireEvent.click(screen.getByRole('button', { name: 'Set Primary' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove' })[0]);

    expect(screen.queryByText('•••• •••• •••• 1111')).toBeNull();
    expect(screen.getByText('Primary')).toBeTruthy();
  });
});
