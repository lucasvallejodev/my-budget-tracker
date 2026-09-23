'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, CreditCard } from 'lucide-react';
import { Panel, EmptyState, StatusBadge } from './blocks';
import { Button } from '../primitives/button';
import s from './finance.module.scss';
import { Dialog, DialogContent, DialogTitle } from '../primitives/dialog';
import { Input } from '../primitives/input';

export type PaymentCard = {
  id: string;
  name: string;
  lastFour: string;
  expires: string;
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
      <div className={s.stack}>
        {cards.map(card => (
          <article key={card.id} className={s.budget}>
            <div className={s.card}>
              <div className={s.balanceTitle}>
                <CreditCard />
                <strong>{card.network || 'VISA'}</strong>
              </div>
              <div className={s.cardNumber}>•••• •••• •••• {card.lastFour}</div>
              <div className={s.cardMeta}>
                <span>{card.name}</span>
                <span>Expires {card.expires}</span>
              </div>
            </div>
            <div className={s.actions}>
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
                  const remaining = cards.filter(c => c.id !== card.id);

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
            className={s.form}
            onSubmit={e => {
              e.preventDefault();
              const id = crypto.randomUUID();

              setCards(all => [
                ...all,
                {
                  id,
                  name,
                  lastFour: '0000',
                  expires: '12/29',
                },
              ]);
              if (!cards.length) setPrimary(id);
              setOpen(false);
              setName('');
            }}
          >
            <label className={s.field}>
              Display name
              <Input value={name} onChange={e => setName(e.target.value)} required />
            </label>
            <Button type="submit">Add sample card</Button>
          </form>
        </DialogContent>
      </Dialog>
    </Panel>
  );
}

export function PaymentCards({
  cards,
  action,
}: {
  cards: PaymentCard[];
  action?: React.ReactNode;
}) {
  const [index, setIndex] = useState(0);
  const card = cards[Math.min(index, cards.length - 1)];

  return (
    <Panel title="My card" action={action}>
      {card ? (
        <>
          <div className={s.card}>
            <div className={s.balanceTitle}>
              <CreditCard size={24} />
              <strong>{card.network || 'VISA'}</strong>
            </div>
            <div className={s.cardNumber}>•••• •••• •••• {card.lastFour}</div>
            <div className={s.cardMeta}>
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
          <div className={s.pagination}>
            <span>
              {index + 1} / {cards.length}
            </span>
            <div className={s.actions}>
              <Button
                variant="outline"
                size="icon"
                aria-label="Previous card"
                disabled={index === 0}
                onClick={() => setIndex(i => i - 1)}
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Next card"
                disabled={index >= cards.length - 1}
                onClick={() => setIndex(i => i + 1)}
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
