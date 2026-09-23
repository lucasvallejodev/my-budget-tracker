'use client';

import { ChevronLeft, ChevronRight, CreditCard } from 'lucide-react';
import { useState } from 'react';

import { Button } from '../primitives/button';
import { Dialog, DialogContent, DialogTitle } from '../primitives/dialog';
import { Input } from '../primitives/input';
import { EmptyState, Panel, StatusBadge } from './blocks';
import styles from './finance.module.scss';

export type PaymentCard = {
  expires: string;
  id: string;
  lastFour: string;
  name: string;
  network?: string;
};

export function PaymentCardList({ initialCards }: { initialCards: PaymentCard[] }) {
  const [cards, setCards] = useState(initialCards);
  const [primary, setPrimary] = useState(initialCards[0]?.id);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

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
      <div className={styles.stack}>
        {cards.map(card => (
          <article key={card.id} className={styles.budget}>
            <div className={styles.card}>
              <div className={styles.balanceTitle}>
                <CreditCard />
                <strong>{card.network || 'VISA'}</strong>
              </div>
              <div className={styles.cardNumber}>•••• •••• •••• {card.lastFour}</div>
              <div className={styles.cardMeta}>
                <span>{card.name}</span>
                <span>Expires {card.expires}</span>
              </div>
            </div>
            <div className={styles.actions}>
              {primary === card.id ? (
                <StatusBadge>Primary</StatusBadge>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setPrimary(card.id)}>
                  Set Primary
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  const remaining = cards.filter(other => other.id !== card.id);

                  setCards(remaining);
                  if (primary === card.id) setPrimary(remaining[0]?.id);
                }}
              >
                Remove
              </Button>
            </div>
          </article>
        ))}
        {!cards.length && <EmptyState title="No sample cards" />}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Add sample card</DialogTitle>
          <p>No payment details are collected. This card lasts for this preview only.</p>
          <form
            className={styles.form}
            onSubmit={event => {
              event.preventDefault();
              const id = crypto.randomUUID();

              setCards(all => [
                ...all,
                {
                  expires: '12/29',
                  id,
                  lastFour: '0000',
                  name,
                },
              ]);
              if (!cards.length) setPrimary(id);
              setOpen(false);
              setName('');
            }}
          >
            <label className={styles.field}>
              Display name
              <Input value={name} onChange={event => setName(event.target.value)} required />
            </label>
            <Button type="submit">Add sample card</Button>
          </form>
        </DialogContent>
      </Dialog>
    </Panel>
  );
}

export function PaymentCards({
  action,
  cards,
}: {
  action?: React.ReactNode;
  cards: PaymentCard[];
}) {
  const [index, setIndex] = useState(0);
  const card = cards[Math.min(index, cards.length - 1)];

  return (
    <Panel title="My card" action={action}>
      {card ? (
        <>
          <div className={styles.card}>
            <div className={styles.balanceTitle}>
              <CreditCard size={24} />
              <strong>{card.network || 'VISA'}</strong>
            </div>
            <div className={styles.cardNumber}>•••• •••• •••• {card.lastFour}</div>
            <div className={styles.cardMeta}>
              <div>
                <small>Cardholder</small>
                {card.name}
              </div>
              <div>
                <small>Exp. date</small>
                {card.expires}
              </div>
            </div>
          </div>
          <div className={styles.pagination}>
            <span>
              {index + 1} / {cards.length}
            </span>
            <div className={styles.actions}>
              <Button
                variant="outline"
                size="icon"
                aria-label="Previous card"
                disabled={index === 0}
                onClick={() => setIndex(current => current - 1)}
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Next card"
                disabled={index >= cards.length - 1}
                onClick={() => setIndex(current => current + 1)}
              >
                <ChevronRight />
              </Button>
            </div>
          </div>
        </>
      ) : (
        <EmptyState title="No cards added" />
      )}
    </Panel>
  );
}
