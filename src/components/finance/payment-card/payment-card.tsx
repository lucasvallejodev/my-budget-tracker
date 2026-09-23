import './payment-card.scss';

import { CreditCard } from 'lucide-react';

const DefaultNetwork = 'VISA';

export type PaymentCardDetails = {
  expires: string;
  id: string;
  lastFour: string;
  name: string;
  network?: string;
};

export function PaymentCard({
  card,
  layout = 'summary',
}: {
  card: PaymentCardDetails;
  layout?: 'summary' | 'labelled';
}) {
  return (
    <div className="payment-card">
      <div className="payment-card__header">
        <CreditCard />
        <strong>{card.network || DefaultNetwork}</strong>
      </div>
      <div className="payment-card__number">•••• •••• •••• {card.lastFour}</div>
      {layout === 'summary' ? (
        <div className="payment-card__meta">
          <span>{card.name}</span>
          <span>Expires {card.expires}</span>
        </div>
      ) : (
        <div className="payment-card__meta">
          <div>
            <small className="payment-card__meta-label">Cardholder</small>
            {card.name}
          </div>
          <div>
            <small className="payment-card__meta-label">Exp. date</small>
            {card.expires}
          </div>
        </div>
      )}
    </div>
  );
}
