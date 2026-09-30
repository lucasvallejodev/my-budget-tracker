import './attention-strip.scss';

import { ChevronRight, CircleAlert, Gauge, Inbox, LucideIcon } from 'lucide-react';
import Link from 'next/link';

import { cn } from '@/lib/styles';

export type AttentionTone = 'brand' | 'danger' | 'warning';

export type AttentionItem = {
  href: string;
  id: string;
  label: string;
  tone: AttentionTone;
};

const MaxItems = 3;

const ToneIcons: Record<AttentionTone, LucideIcon> = {
  brand: Inbox,
  danger: CircleAlert,
  warning: Gauge,
};

const ToneClassNames: Record<AttentionTone, string> = {
  brand: '',
  danger: 'attention-strip__icon--danger',
  warning: 'attention-strip__icon--warning',
};

export function AttentionStrip({ items }: { items: AttentionItem[] }) {
  if (!items.length) return null;

  return (
    <nav className="attention-strip" aria-label="Needs attention">
      <ul className="attention-strip__list">
        {items.slice(0, MaxItems).map(item => {
          const ToneIcon = ToneIcons[item.tone];

          return (
            <li key={item.id} className="attention-strip__item">
              <Link className="attention-strip__link" href={item.href}>
                <span className={cn('attention-strip__icon', ToneClassNames[item.tone])}>
                  <ToneIcon aria-hidden />
                </span>
                <span className="attention-strip__label">{item.label}</span>
                <ChevronRight className="attention-strip__chevron" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
