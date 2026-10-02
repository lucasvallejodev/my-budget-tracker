'use client';

import './template-chips.scss';

import Link from 'next/link';

import { Button, Combobox } from '@/components/ui';
import { formatMoney } from '@coinkeeper/shared/lib/money';

import { UnavailableLabels } from '../template-labels';
import { TemplateRow, useTemplates } from '../use-finance-data';
import { chipOrder } from './template-preset';

const QUICK_TEMPLATES = 4;

const chipDetail = (template: TemplateRow): string => {
  if (template.unavailableReason) return UnavailableLabels[template.unavailableReason];
  if (template.amountMinor === null || !template.currency) return 'amount each time';

  return formatMoney(Math.abs(template.amountMinor), template.currency);
};

function AllTemplates({
  onPick,
  templates,
}: {
  onPick: (template: TemplateRow) => void;
  templates: TemplateRow[];
}) {
  const usable = templates.filter(template => !template.unavailableReason);

  return (
    <Combobox
      variant="chip"
      label="Choose a template"
      placeholder={`All templates (${templates.length})`}
      searchPlaceholder="Search templates"
      sections={[
        {
          heading: 'Templates',
          id: 'templates',
          options: usable.map(template => ({
            hint: chipDetail(template),
            id: template.id,
            keywords: [template.name],
            label: template.name,
          })),
        },
      ]}
      onChange={id => {
        const template = usable.find(item => item.id === id);

        if (template) onPick(template);
      }}
    />
  );
}

export function TemplateChips({ onPick }: { onPick: (template: TemplateRow) => void }) {
  const templates = chipOrder(useTemplates().data ?? []);

  if (!templates.length) return null;

  const quick = templates.slice(0, QUICK_TEMPLATES);
  const needsAttention = templates.some(template => template.unavailableReason);

  return (
    <div className="template-chips">
      <p className="template-chips__intro">
        Start from a template: it fills the form, you review it and save.
      </p>
      <div className="template-chips__list" role="group" aria-label="Templates">
        {quick.map(template => (
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
        {templates.length > QUICK_TEMPLATES && (
          <AllTemplates templates={templates} onPick={onPick} />
        )}
      </div>
      <Link className="template-chips__manage" href="/settings/templates">
        {needsAttention ? 'Some templates need fixing: manage templates' : 'Manage templates'}
      </Link>
    </div>
  );
}
