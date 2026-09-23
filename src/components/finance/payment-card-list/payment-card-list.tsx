'use client';

import './payment-card-list.scss';

import { useState } from 'react';

import {
  Badge,
  Button,
  Cluster,
  Dialog,
  DialogContent,
  DialogTitle,
  EmptyState,
  Field,
  FormStack,
  Input,
  Panel,
  Stack,
} from '@/components/ui';

import { PaymentCard, PaymentCardDetails } from '../payment-card';

const SampleExpiry = '12/29';
const SampleLastFour = '0000';

export function PaymentCardList({ initialCards }: { initialCards: PaymentCardDetails[] }) {
  const [cards, setCards] = useState(initialCards);
  const [primary, setPrimary] = useState(initialCards[0]?.id);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  const remove = (card: PaymentCardDetails) => {
    const remaining = cards.filter(other => other.id !== card.id);

    setCards(remaining);
    if (primary === card.id) setPrimary(remaining[0]?.id);
  };

  return (
    <Panel
      title="My Cards"
      description="Sample card management controls"
      action={
        <Button variant="outline" onClick={() => setOpen(true)}>
          Add Card
        </Button>
      }
    >
      <Stack>
        {cards.map(card => (
          <article key={card.id} className="payment-card-list__item">
            <PaymentCard card={card} />
            <Cluster>
              {primary === card.id ? (
                <Badge>Primary</Badge>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setPrimary(card.id)}>
                  Set Primary
                </Button>
              )}
              <Button variant="destructive" size="sm" onClick={() => remove(card)}>
                Remove
              </Button>
            </Cluster>
          </article>
        ))}
        {!cards.length && <EmptyState title="No sample cards" />}
      </Stack>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Add sample card</DialogTitle>
          <p>No payment details are collected. This card lasts for this preview only.</p>
          <FormStack
            onSubmit={event => {
              event.preventDefault();
              const id = crypto.randomUUID();

              setCards(all => [
                ...all,
                {
                  expires: SampleExpiry,
                  id,
                  lastFour: SampleLastFour,
                  name,
                },
              ]);
              if (!cards.length) setPrimary(id);
              setOpen(false);
              setName('');
            }}
          >
            <Field>
              Display name
              <Input value={name} onChange={event => setName(event.target.value)} required />
            </Field>
            <Button type="submit">Add sample card</Button>
          </FormStack>
        </DialogContent>
      </Dialog>
    </Panel>
  );
}
