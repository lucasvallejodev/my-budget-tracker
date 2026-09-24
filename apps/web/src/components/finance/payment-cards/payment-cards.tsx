'use client';

import { ReactNode, useState } from 'react';

import { EmptyState, Pagination, Panel } from '@/components/ui';

import { PaymentCard, PaymentCardDetails } from '../payment-card';

export function PaymentCards({
  action,
  cards,
}: {
  action?: ReactNode;
  cards: PaymentCardDetails[];
}) {
  const [index, setIndex] = useState(0);
  const card = cards[Math.min(index, cards.length - 1)];

  return (
    <Panel title="My card" action={action}>
      {card ? (
        <>
          <PaymentCard card={card} layout="labelled" />
          <Pagination
            variant="compact"
            label="Cards"
            itemLabel="card"
            page={index + 1}
            pages={cards.length}
            onChange={page => setIndex(page - 1)}
          />
        </>
      ) : (
        <EmptyState title="No cards added" />
      )}
    </Panel>
  );
}
