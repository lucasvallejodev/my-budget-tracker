import { Check, Sparkles } from 'lucide-react';

import { Badge, Button } from '@/components/ui';

type ActionKind = 'accept' | 'confirm' | 'save';

const ActionLabels: Record<ActionKind, { button: string; name: string }> = {
  accept: { button: 'Accept', name: 'Accept' },
  confirm: { button: 'Done', name: 'Mark as reviewed' },
  save: { button: 'Done', name: 'Save the category of' },
};

export const actionKind = (chosen: boolean, suggested: boolean): ActionKind => {
  if (chosen) return 'save';

  return suggested ? 'accept' : 'confirm';
};

export function ReviewAction({
  className,
  kind,
  onConfirm,
  title,
}: {
  className: string;
  kind: ActionKind;
  onConfirm: () => void;
  title: string;
}) {
  return (
    <Button
      className={className}
      size="sm"
      variant={kind === 'confirm' ? 'outline' : 'default'}
      aria-label={`${ActionLabels[kind].name}: ${title}`}
      onClick={onConfirm}
    >
      <Check aria-hidden /> {ActionLabels[kind].button}
    </Button>
  );
}

export function CategoryNote({ chosen, suggested }: { chosen: boolean; suggested: boolean }) {
  if (chosen) return <Badge tone="warning">Not saved yet</Badge>;
  if (!suggested) return null;

  return (
    <Badge tone="info" icon={<Sparkles aria-hidden />}>
      Suggested
    </Badge>
  );
}
