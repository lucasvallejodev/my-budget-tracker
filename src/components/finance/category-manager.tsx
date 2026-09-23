'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Archive, ArrowDown, ArrowUp, Pencil, Plus, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useEntityMutation } from '@/app/(main)/_components/use-entity-mutation';
import {
  archiveCategoryAction,
  archiveCategoryGroupAction,
  createCategoryAction,
  createCategoryGroupAction,
  reorderCategoriesAction,
  reorderCategoryGroupsAction,
  restoreCategoryAction,
  updateCategoryAction,
  updateCategoryGroupAction,
} from '@/app/(main)/actions';
import { Colors } from '@/styles/theme';

import formStyles from '../forms.module.scss';
import { Icon } from '../icon';
import { ColorPicker, IconPicker } from '../icons/icon-picker';
import { IconName } from '../icons/registry';
import { Button } from '../primitives/button';
import { Dialog, DialogContent, DialogTitle } from '../primitives/dialog';
import { Input } from '../primitives/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../primitives/select';
import { EmptyState, Panel, StatusBadge } from './blocks';
import styles from './finance.module.scss';
import { CategoryTree, FinanceKeys, useCategories } from './use-finance-data';

type Group = CategoryTree;
type Category = CategoryTree['categories'][number];

const NewGroup: Pick<Group, 'name' | 'kind' | 'color'> = {
  color: Colors.group.blue,
  kind: 'expense',
  name: '',
};

function useRefresh() {
  const queryClient = useQueryClient();

  return () =>
    Promise.all(FinanceKeys.map(key => queryClient.invalidateQueries({ queryKey: [key] })));
}

const archiveDescription = (count: number, groupName: string): string => {
  if (!count) {
    return 'This category has no transactions. It disappears from pickers but can be restored later.';
  }

  const noun = count === 1 ? 'transaction' : 'transactions';

  return `${count} ${noun} use this category in ${groupName}. Move them to another category, or keep them and they will reappear in the review inbox.`;
};

export function CategoryManager() {
  const tree = useCategories(true);
  const refresh = useRefresh();
  const [groupDialog, setGroupDialog] = useState<{ group?: Group } | null>(null);

  const [categoryDialog, setCategoryDialog] = useState<{
    category?: Category;
    groupId: string;
  } | null>(null);

  const [archiving, setArchiving] = useState<{ category: Category; group: Group } | null>(null);
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
    const ordered = groups.map(group => group.id);
    const target = index + delta;

    if (target < 0 || target >= ordered.length) return;
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    run.mutate({ fn: () => reorderCategoryGroupsAction(ordered) });
  };

  const moveCategory = (group: Group, index: number, delta: number) => {
    const live = group.categories.filter(category => !category.archivedAt);
    const ordered = live.map(category => category.id);
    const target = index + delta;

    if (target < 0 || target >= ordered.length) return;
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    run.mutate({ fn: () => reorderCategoriesAction(group.id, ordered) });
  };

  if (tree.isPending) return <p role="status">Loading categories…</p>;
  if (tree.isError) return <EmptyState title="Could not load categories" />;

  return (
    <div className={styles.stack}>
      <div className={styles.actions}>
        <Button onClick={() => setGroupDialog({})}>
          <Plus /> New group
        </Button>
        <Button variant="outline" onClick={() => setShowArchived(visible => !visible)}>
          {showArchived ? 'Hide archived' : 'Show archived'}
        </Button>
      </div>
      {groups.map((group, groupIndex) => {
        const live = group.categories.filter(category => !category.archivedAt);
        const archived = group.categories.filter(category => category.archivedAt);

        return (
          <Panel
            key={group.id}
            title={group.name}
            description={`${group.kind === 'income' ? 'Income' : 'Expense'} group · ${live.length} categor${live.length === 1 ? 'y' : 'ies'}`}
            action={
              <div className={styles.actions}>
                <span
                  className={styles.swatch}
                  style={{ background: group.color }}
                  aria-label={`Colour ${group.color}`}
                />
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={`Move ${group.name} up`}
                  disabled={groupIndex === 0}
                  onClick={() => moveGroup(groupIndex, -1)}
                >
                  <ArrowUp size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={`Move ${group.name} down`}
                  disabled={groupIndex === groups.length - 1}
                  onClick={() => moveGroup(groupIndex, 1)}
                >
                  <ArrowDown size={16} />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setGroupDialog({ group })}>
                  <Pencil size={14} /> Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCategoryDialog({ groupId: group.id })}
                >
                  <Plus size={14} /> Category
                </Button>
                {!group.isSystem && (
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label={`Archive group ${group.name}`}
                    onClick={() =>
                      run.mutate({
                        done: `Archived ${group.name}`,
                        fn: () => archiveCategoryGroupAction(group.id),
                      })
                    }
                  >
                    <Archive size={14} />
                  </Button>
                )}
              </div>
            }
          >
            {!live.length && <p className={styles.muted}>No categories yet.</p>}
            {live.map((category, index) => (
              <div key={category.id} className={styles.row}>
                <div className={styles.actions}>
                  <span
                    className={styles.metricIcon}
                    style={{ background: group.color, color: 'white' }}
                  >
                    <Icon icon={category.icon} />
                  </span>
                  <div>
                    <h3>{category.name}</h3>
                    <p>
                      {category.transactionCount} transaction
                      {category.transactionCount === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>
                <div className={styles.actions}>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Move ${category.name} up`}
                    disabled={index === 0}
                    onClick={() => moveCategory(group, index, -1)}
                  >
                    <ArrowUp size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Move ${category.name} down`}
                    disabled={index === live.length - 1}
                    onClick={() => moveCategory(group, index, 1)}
                  >
                    <ArrowDown size={16} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label={`Edit ${category.name}`}
                    onClick={() => setCategoryDialog({ category, groupId: group.id })}
                  >
                    <Pencil size={14} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label={`Archive ${category.name}`}
                    onClick={() => setArchiving({ category, group })}
                  >
                    <Archive size={14} />
                  </Button>
                </div>
              </div>
            ))}
            {showArchived &&
              archived.map(category => (
                <div key={category.id} className={styles.row}>
                  <div className={styles.actions}>
                    <span className={styles.metricIcon}>
                      <Icon icon={category.icon} />
                    </span>
                    <div>
                      <h3>{category.name}</h3>
                      <p>
                        <StatusBadge tone="neutral">Archived</StatusBadge>{' '}
                        {category.transactionCount} transaction
                        {category.transactionCount === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      run.mutate({
                        done: `Restored ${category.name}`,
                        fn: () => restoreCategoryAction(category.id),
                      })
                    }
                  >
                    <RotateCcw size={14} /> Restore
                  </Button>
                </div>
              ))}
          </Panel>
        );
      })}
      {groupDialog && (
        <GroupDialog
          group={groupDialog.group}
          onClose={() => setGroupDialog(null)}
          onSaved={() => setGroupDialog(null)}
        />
      )}
      {categoryDialog && (
        <CategoryDialog
          groups={groups}
          groupId={categoryDialog.groupId}
          category={categoryDialog.category}
          onClose={() => setCategoryDialog(null)}
          onSaved={() => setCategoryDialog(null)}
        />
      )}
      {archiving && (
        <ArchiveDialog
          category={archiving.category}
          group={archiving.group}
          groups={groups}
          onClose={() => setArchiving(null)}
          onDone={async () => {
            await refresh();
            setArchiving(null);
          }}
        />
      )}
    </div>
  );
}

function GroupDialog({
  group,
  onClose,
  onSaved,
}: {
  group?: Group;
  onClose: () => void;
  onSaved: () => void;
}) {
  const initial = group ?? NewGroup;
  const [name, setName] = useState(initial.name);
  const [kind, setKind] = useState<'income' | 'expense'>(initial.kind);
  const [color, setColor] = useState(initial.color);

  const save = useEntityMutation({
    mutationFn: () => {
      const values = {
        color,
        kind,
        name,
      };

      return group
        ? updateCategoryGroupAction(group.id, values)
        : createCategoryGroupAction(values);
    },
    onSuccess: onSaved,
    successMessage: group ? 'Group updated' : 'Group created',
  });

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent>
        <DialogTitle>{group ? 'Edit group' : 'New group'}</DialogTitle>
        <form
          className={formStyles.form}
          onSubmit={event => {
            event.preventDefault();
            save.mutate();
          }}
        >
          <label className={styles.field}>
            Name
            <Input
              value={name}
              onChange={event => setName(event.target.value)}
              required
              maxLength={50}
            />
          </label>
          <label className={styles.field}>
            Kind
            <Select
              value={kind}
              disabled={group?.isSystem}
              onValueChange={value => setKind(value as 'income' | 'expense')}
            >
              <SelectTrigger className={formStyles.full}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </label>
          <div className={styles.field}>
            Colour (shared by every category in the group)
            <ColorPicker value={color} onChange={setColor} />
          </div>
          <Button type="submit" disabled={save.isPending || !name.trim()}>
            {group ? 'Save' : 'Create group'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CategoryDialog({
  category,
  groupId,
  groups,
  onClose,
  onSaved,
}: {
  category?: Category;
  groupId: string;
  groups: Group[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(category?.name ?? '');
  const [icon, setIcon] = useState<string>(category?.icon ?? 'Shapes');
  const [group, setGroup] = useState(groupId);
  const color = groups.find(candidate => candidate.id === group)?.color;

  const save = useEntityMutation({
    mutationFn: () => {
      const values = {
        groupId: group,
        icon: icon as IconName,
        name,
      };

      return category ? updateCategoryAction(category.id, values) : createCategoryAction(values);
    },
    onSuccess: onSaved,
    successMessage: category ? 'Category updated' : 'Category created',
  });

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent>
        <DialogTitle>{category ? 'Edit category' : 'New category'}</DialogTitle>
        <form
          className={formStyles.form}
          onSubmit={event => {
            event.preventDefault();
            save.mutate();
          }}
        >
          <label className={styles.field}>
            Name
            <Input
              value={name}
              onChange={event => setName(event.target.value)}
              required
              maxLength={50}
            />
          </label>
          <label className={styles.field}>
            Group
            <Select value={group} onValueChange={setGroup}>
              <SelectTrigger className={formStyles.full}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {groups.map(group => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </label>
          <div className={styles.field}>
            Icon
            <IconPicker value={icon} onChange={setIcon} color={color} />
          </div>
          <Button type="submit" disabled={save.isPending || !name.trim()}>
            {category ? 'Save' : 'Create category'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ArchiveDialog({
  category,
  group,
  groups,
  onClose,
  onDone,
}: {
  category: Category;
  group: Group;
  groups: Group[];
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  const [moveTo, setMoveTo] = useState('');

  const options = groups.flatMap(group =>
    group.categories
      .filter(candidate => !candidate.archivedAt && candidate.id !== category.id)
      .map(candidate => ({ id: candidate.id, label: `${group.name} › ${candidate.name}` }))
  );

  const archive = useMutation({
    mutationFn: () => archiveCategoryAction(category.id, moveTo || undefined),
    onError: (error: Error) => toast.error(error.message),
    onSuccess: async () => {
      toast.success(`Archived ${category.name}`);
      await onDone();
    },
  });

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent>
        <DialogTitle>Archive {category.name}?</DialogTitle>
        <p className={styles.muted}>{archiveDescription(category.transactionCount, group.name)}</p>
        {category.transactionCount > 0 && (
          <label className={styles.field}>
            Move transactions to
            <Select
              value={moveTo || '__none'}
              onValueChange={value => setMoveTo(value === '__none' ? '' : value)}
            >
              <SelectTrigger className={formStyles.full}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="__none">Keep uncategorized (review later)</SelectItem>
                  {options.map(option => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </label>
        )}
        <div className={styles.actions}>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={archive.isPending}
            onClick={() => archive.mutate()}
          >
            Archive
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
