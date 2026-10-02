'use client';

import './template-chips.scss';

import Link from 'next/link';

import { Button } from '@/components/ui';
import { formatMoney } from '@coinkeeper/shared/lib/money';

import { UnavailableLabels } from '../template-labels';
import { TemplateRow, useTemplates } from '../use-finance-data';
import { chipOrder } from './template-preset';

const chipDetail = (template: TemplateRow): string => {
  if (template.unavailableReason) return UnavailableLabels[template.unavailableReason];
  if (template.amountMinor === null || !template.currency) return '…';

  return formatMoney(Math.abs(template.amountMinor), template.currency);
};

export function TemplateChips({ onPick }: { onPick: (template: TemplateRow) => void }) {
  const templates = chipOrder(useTemplates().data ?? []);

  if (!templates.length) return null;

  const needsAttention = templates.some(template => template.unavailableReason);

  return (
    <div className="template-chips">
      <div className="template-chips__list" role="group" aria-label="Templates">
        {templates.map(template => (
          <Button
            key={template.id}
            type="button"
            size="sm"
            variant="outline"
            className="template-chips__chip"
            disabled={!!template.unavailableReason}
            onClick={() => onPick(template)}
          >
            <span>{template.name}</span>
            <span className="template-chips__detail">{chipDetail(template)}</span>
          </Button>
        ))}
      </div>
      {needsAttention && (
        <Link className="template-chips__manage" href="/settings/templates">
          Fix templates in Settings
        </Link>
      )}
    </div>
  );
}
