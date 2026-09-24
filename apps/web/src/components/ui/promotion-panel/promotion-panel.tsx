import './promotion-panel.scss';

import { ArrowUpRight, Zap } from 'lucide-react';

import { Button } from '../button';

const PromotionIconSize = 18;
const LinkIconSize = 16;

export function PromotionPanel({
  actionLabel,
  description,
  href,
  title,
}: {
  actionLabel: string;
  description: string;
  href: string;
  title: string;
}) {
  return (
    <aside className="promotion-panel">
      <h3>
        <Zap size={PromotionIconSize} /> {title}
      </h3>
      <p className="promotion-panel__description">{description}</p>
      <Button asChild variant="secondary">
        <a href={href}>
          {actionLabel}
          <ArrowUpRight size={LinkIconSize} />
        </a>
      </Button>
    </aside>
  );
}
