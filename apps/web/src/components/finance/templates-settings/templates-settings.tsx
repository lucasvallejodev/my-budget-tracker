'use client';

import { useMutation } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { deleteTemplate, reorderTemplates, restoreTemplate } from '@/api/mutations';
import { Badge, Button, EmptyState, ListRow, Panel, QueryContent, Stack } from '@/components/ui';
import { useDialogState } from '@/lib/dialog-state';

import { describeTemplate, UnavailableLabels } from '../template-labels';
import { TemplateRow, useAccounts, useRefreshFinance, useTemplates } from '../use-finance-data';
import { TemplateFormDialog } from './template-form-dialog';

const ActionIconSize = 16;

const movedIds = (templates: TemplateRow[], index: number, step: number): string[] => {
  const ids = templates.map(template => template.id);
  const target = index + step;

  [ids[index], ids[target]] = [ids[target], ids[index]];

  return ids;
};

function TemplateActions({
  index,
  onDelete,
  onEdit,
  onMove,
  template,
  total,
}: {
  index: number;
  onDelete: () => void;
  onEdit: () => void;
  onMove: (step: number) => void;
  template: TemplateRow;
  total: number;
}) {
  return (
    <>
      {template.unavailableReason && (
        <Badge tone="warning">{UnavailableLabels[template.unavailableReason]}</Badge>
      )}
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Move ${template.name} up`}
        disabled={index === 0}
        onClick={() => onMove(-1)}
      >
        <ArrowUp size={ActionIconSize} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Move ${template.name} down`}
        disabled={index === total - 1}
        onClick={() => onMove(1)}
      >
        <ArrowDown size={ActionIconSize} />
      </Button>
      <Button variant="ghost" size="icon" aria-label={`Edit ${template.name}`} onClick={onEdit}>
        <Pencil size={ActionIconSize} />
      </Button>
      <Button variant="ghost" size="icon" aria-label={`Delete ${template.name}`} onClick={onDelete}>
        <Trash2 size={ActionIconSize} />
      </Button>
    </>
  );
}

export function TemplatesSettings() {
  const refresh = useRefreshFinance();
  const templates = useTemplates();
  const accounts = useAccounts(true);
  const editing = useDialogState<{ template?: TemplateRow }>();
  const items = templates.data ?? [];
  const accountNames = new Map(accounts.data?.map(account => [account.id, account.name]));

  const reorder = useMutation({
    mutationFn: reorderTemplates,
    onError: (error: Error) => toast.error(error.message),
    onSuccess: refresh,
  });

  const remove = useMutation({
    mutationFn: (template: TemplateRow) => deleteTemplate(template.id),
    onError: (error: Error) => toast.error(error.message),
    onSuccess: async (unused, template) => {
      toast.success('Template deleted', {
        action: {
          label: 'Undo',
          onClick: () => void restoreTemplate(template.id).then(refresh),
        },
      });
      await refresh();
    },
  });

  return (
    <Stack>
      <Panel
        title="Templates"
        description="Pick a template at the top of the transaction form to fill it in one tap. The order here is used until you start using them; then the most recent come first."
        action={<Button onClick={() => editing.open({})}>New template</Button>}
      >
        <QueryContent
          pending={templates.isPending}
          error={templates.isError}
          loading="Loading templates…"
          empty={
            !items.length && (
              <EmptyState
                title="No templates yet"
                description="Create one here, or choose Save as template in the transaction form or a row menu."
              />
            )
          }
        >
          {() =>
            items.map((template, index) => (
              <ListRow
                key={template.id}
                title={template.name}
                description={describeTemplate(template, accountNames)}
              >
                <TemplateActions
                  index={index}
                  template={template}
                  total={items.length}
                  onDelete={() => remove.mutate(template)}
                  onEdit={() => editing.open({ template })}
                  onMove={step => reorder.mutate(movedIds(items, index, step))}
                />
              </ListRow>
            ))
          }
        </QueryContent>
      </Panel>
      {editing.value && (
        <TemplateFormDialog template={editing.value.template} onClose={editing.close} />
      )}
    </Stack>
  );
}
