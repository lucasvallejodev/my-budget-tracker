import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { PaymentCard } from './payment-card';

afterEach(cleanup);

const card = {
  expires: '12/28',
  id: 'card-1',
  lastFour: '2588',
  name: 'Alex Morgan',
};

describe('PaymentCard', () => {
  it('masks the number and defaults the network', () => {
    render(<PaymentCard card={card} />);

    expect(screen.getByText('•••• •••• •••• 2588')).toBeTruthy();
    expect(screen.getByText('VISA')).toBeTruthy();
    expect(screen.getByText('Expires 12/28')).toBeTruthy();
  });

  it('labels the holder and expiry in the labelled layout', () => {
    render(<PaymentCard card={card} layout="labelled" />);

    expect(screen.getByText('Cardholder')).toBeTruthy();
    expect(screen.getByText('Exp. date')).toBeTruthy();
  });
});
