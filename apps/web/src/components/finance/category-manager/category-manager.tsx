'use client';

import { useMutation } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  archiveCategoryGroup,
  reorderCategories,
  reorderCategoryGroups,
  unarchiveCategory,
} from '@/api/mutations';
import { Button, Cluster, EmptyState, Stack } from '@/components/ui';
import { useDialogState } from '@/lib/dialog-state';

import { useCategories, useRefreshFinance } from '../use-finance-data';
import { ArchiveDialog, CategoryDialog, GroupDialog } from './category-dialogs';
import { CategoryGroupPanel } from './category-group-panel';
import type { Category, Group } from './category-types';

const swapped = (ids: string[], index: number, delta: number): string[] | null => {
  const target = index + delta;

  if (target < 0 || target >= ids.length) return null;
  const ordered = [...ids];

  [ordered[index], ordered[target]] = [ordered[target], ordered[index]];

  return ordered;
};

export function CategoryManager() {
  const tree = useCategories(true);
  const refresh = useRefreshFinance();
  const groupDialog = useDialogState<{ group?: Group }>();
  const categoryDialog = useDialogState<{ category?: Category; groupId: string }>();
  const archiving = useDialogState<{ category: Category; group: Group }>();
  const [showArchived, setShowArchived] = useState(false);
  const groups = (tree.data ?? []).filter(group => !group.archivedAt);

  const run = useMutation({
    mutationFn: async ({ fn }: { done?: string; fn: () => Promise<unknown> }) => fn(),
    onError: (error: Error) => toast.error(error.message),
    onSuccess: async (result, { done }) => {
      if (done) toast.success(done);
      await refresh();
    },
  });

  const moveGroup = (index: number, delta: number) => {
    const ordered = swapped(
      groups.map(group => group.id),
      index,
      delta
    );

    if (ordered) run.mutate({ fn: () => reorderCategoryGroups(ordered) });
  };

  const moveCategory = (group: Group, index: number, delta: number) => {
    const live = group.categories.filter(category => !category.archivedAt);

    const ordered = swapped(
      live.map(category => category.id),
      index,
      delta
    );

    if (ordered) run.mutate({ fn: () => reorderCategories(group.id, ordered) });
  };

  if (tree.isPending) return <p role="status">Loading categories…</p>;
  if (tree.isError) return <EmptyState title="Could not load categories" />;

  return (
    <Stack>
      <Cluster>
        <Button onClick={() => groupDialog.open({})}>
          <Plus /> New group
        </Button>
        <Button variant="outline" onClick={() => setShowArchived(visible => !visible)}>
          {showArchived ? 'Hide archived' : 'Show archived'}
        </Button>
      </Cluster>
      {groups.map((group, groupIndex) => (
        <CategoryGroupPanel
          key={group.id}
          group={group}
          isFirst={groupIndex === 0}
          isLast={groupIndex === groups.length - 1}
          showArchived={showArchived}
          onMoveGroup={delta => moveGroup(groupIndex, delta)}
          onMoveCategory={(index, delta) => moveCategory(group, index, delta)}
          onEditGroup={() => groupDialog.open({ group })}
          onAddCategory={() => categoryDialog.open({ groupId: group.id })}
          onEditCategory={category => categoryDialog.open({ category, groupId: group.id })}
          onArchiveCategory={category => archiving.open({ category, group })}
          onArchiveGroup={() =>
            run.mutate({
              done: `Archived ${group.name}`,
              fn: () => archiveCategoryGroup(group.id),
            })
          }
          onRestoreCategory={category =>
            run.mutate({
              done: `Restored ${category.name}`,
              fn: () => unarchiveCategory(category.id),
            })
          }
        />
      ))}
      {groupDialog.value && (
        <GroupDialog
          group={groupDialog.value.group}
          onClose={groupDialog.close}
          onSaved={groupDialog.close}
        />
      )}
      {categoryDialog.value && (
        <CategoryDialog
          groups={groups}
          groupId={categoryDialog.value.groupId}
          category={categoryDialog.value.category}
          onClose={categoryDialog.close}
          onSaved={categoryDialog.close}
        />
      )}
      {archiving.value && (
        <ArchiveDialog
          category={archiving.value.category}
          group={archiving.value.group}
          groups={groups}
          onClose={archiving.close}
          onDone={async () => {
            await refresh();
            archiving.close();
          }}
        />
      )}
    </Stack>
  );
}
