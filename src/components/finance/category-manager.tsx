'use client';

import { Colors } from '@/styles/theme';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, Archive, Pencil, Plus, RotateCcw } from 'lucide-react';
import { Panel, EmptyState, StatusBadge } from './blocks';
import { Button } from '../primitives/button';
import { Input } from '../primitives/input';
import { Dialog, DialogContent, DialogTitle } from '../primitives/dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../primitives/select';
import { Icon } from '../icon';
import { ColorPicker, IconPicker } from '../icons/icon-picker';
import { IconName } from '../icons/registry';
import { CategoryTree, FinanceKeys, useCategories } from './use-finance-data';
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
import s from './finance.module.scss';
import f from '../forms.module.scss';

type Group = CategoryTree;
type Category = CategoryTree['categories'][number];

function useRefresh() {
  const queryClient = useQueryClient();

  return () =>
    Promise.all(FinanceKeys.map(key => queryClient.invalidateQueries({ queryKey: [key] })));
}

export function CategoryManager() {
  const tree = useCategories(true);
  const refresh = useRefresh();
  const [groupDialog, setGroupDialog] = useState<{ group?: Group } | null>(null);

  const [categoryDialog, setCategoryDialog] = useState<{
    groupId: string;
    category?: Category;
  } | null>(null);

  const [archiving, setArchiving] = useState<{ category: Category; group: Group } | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const groups = (tree.data ?? []).filter(g => !g.archivedAt);

  const run = useMutation({
    mutationFn: async ({ fn }: { fn: () => Promise<unknown>; done?: string }) => fn(),
    onSuccess: async (_, { done }) => {
      if (done) toast.success(done);
      await refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const moveGroup = (index: number, delta: number) => {
    const ordered = groups.map(g => g.id);
    const target = index + delta;

    if (target < 0 || target >= ordered.length) return;
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    run.mutate({ fn: () => reorderCategoryGroupsAction(ordered) });
  };

  const moveCategory = (group: Group, index: number, delta: number) => {
    const live = group.categories.filter(c => !c.archivedAt);
    const ordered = live.map(c => c.id);
    const target = index + delta;

    if (target < 0 || target >= ordered.length) return;
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    run.mutate({ fn: () => reorderCategoriesAction(group.id, ordered) });
  };

  if (tree.isPending) return <p role="status">Loading categories…</p>;
  if (tree.isError) return <EmptyState title="Could not load categories" />;

  return (
    <div className={s.stack}>
      <div className={s.actions}>
        <Button onClick={() => setGroupDialog({})}>
          <Plus /> New group
        </Button>
        <Button variant="outline" onClick={() => setShowArchived(v => !v)}>
          {showArchived ? 'Hide archived' : 'Show archived'}
        </Button>
      </div>
      {groups.map((group, groupIndex) => {
        const live = group.categories.filter(c => !c.archivedAt);
        const archived = group.categories.filter(c => c.archivedAt);

        return (
          <Panel
            key={group.id}
            title={group.name}
            description={`${group.kind === 'income' ? 'Income' : 'Expense'} group · ${live.length} categor${live.length === 1 ? 'y' : 'ies'}`}
            action={
              <div className={s.actions}>
                <span
                  className={s.swatch}
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
                        fn: () => archiveCategoryGroupAction(group.id),
                        done: `Archived ${group.name}`,
                      })
                    }
                  >
                    <Archive size={14} />
                  </Button>
                )}
              </div>
            }
          >
            {!live.length && <p className={s.muted}>No categories yet.</p>}
            {live.map((category, index) => (
              <div key={category.id} className={s.row}>
                <div className={s.actions}>
                  <span
                    className={s.metricIcon}
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
                <div className={s.actions}>
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
                    onClick={() => setCategoryDialog({ groupId: group.id, category })}
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
                <div key={category.id} className={s.row}>
                  <div className={s.actions}>
                    <span className={s.metricIcon}>
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
                        fn: () => restoreCategoryAction(category.id),
                        done: `Restored ${category.name}`,
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
          onSaved={async () => {
            await refresh();
            setGroupDialog(null);
          }}
        />
      )}
      {categoryDialog && (
        <CategoryDialog
          groups={groups}
          groupId={categoryDialog.groupId}
          category={categoryDialog.category}
          onClose={() => setCategoryDialog(null)}
          onSaved={async () => {
            await refresh();
            setCategoryDialog(null);
          }}
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
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState(group?.name ?? '');
  const [kind, setKind] = useState<'income' | 'expense'>(group?.kind ?? 'expense');
  const [color, setColor] = useState(group?.color ?? Colors.group.blue);

  const save = useMutation({
    mutationFn: () =>
      group
        ? updateCategoryGroupAction(group.id, {
            name,
            kind,
            color,
          })
        : createCategoryGroupAction({
            name,
            kind,
            color,
          }),
    onSuccess: async () => {
      toast.success(group ? 'Group updated' : 'Group created');
      await onSaved();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent>
        <DialogTitle>{group ? 'Edit group' : 'New group'}</DialogTitle>
        <form
          className={f.form}
          onSubmit={event => {
            event.preventDefault();
            save.mutate();
          }}
        >
          <label className={s.field}>
            Name
            <Input
              value={name}
              onChange={event => setName(event.target.value)}
              required
              maxLength={50}
            />
          </label>
          <label className={s.field}>
            Kind
            <Select
              value={kind}
              disabled={group?.isSystem}
              onValueChange={value => setKind(value as 'income' | 'expense')}
            >
              <SelectTrigger className={f.full}>
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
          <div className={s.field}>
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
  groups,
  groupId,
  category,
  onClose,
  onSaved,
}: {
  groups: Group[];
  groupId: string;
  category?: Category;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState(category?.name ?? '');
  const [icon, setIcon] = useState<string>(category?.icon ?? 'Shapes');
  const [group, setGroup] = useState(groupId);
  const color = groups.find(g => g.id === group)?.color;

  const save = useMutation({
    mutationFn: () =>
      category
        ? updateCategoryAction(category.id, {
            name,
            icon: icon as IconName,
            groupId: group,
          })
        : createCategoryAction({
            name,
            icon: icon as IconName,
            groupId: group,
          }),
    onSuccess: async () => {
      toast.success(category ? 'Category updated' : 'Category created');
      await onSaved();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent>
        <DialogTitle>{category ? 'Edit category' : 'New category'}</DialogTitle>
        <form
          className={f.form}
          onSubmit={event => {
            event.preventDefault();
            save.mutate();
          }}
        >
          <label className={s.field}>
            Name
            <Input
              value={name}
              onChange={event => setName(event.target.value)}
              required
              maxLength={50}
            />
          </label>
          <label className={s.field}>
            Group
            <Select value={group} onValueChange={setGroup}>
              <SelectTrigger className={f.full}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {groups.map(g => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </label>
          <div className={s.field}>
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

  const options = groups.flatMap(g =>
    g.categories
      .filter(c => !c.archivedAt && c.id !== category.id)
      .map(c => ({ id: c.id, label: `${g.name} › ${c.name}` }))
  );

  const archive = useMutation({
    mutationFn: () => archiveCategoryAction(category.id, moveTo || undefined),
    onSuccess: async () => {
      toast.success(`Archived ${category.name}`);
      await onDone();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent>
        <DialogTitle>Archive {category.name}?</DialogTitle>
        <p className={s.muted}>
          {category.transactionCount
            ? `${category.transactionCount} transaction${category.transactionCount === 1 ? '' : 's'} use this category in ${group.name}. Move them to another category, or keep them and they will reappear in the review inbox.`
            : 'This category has no transactions. It disappears from pickers but can be restored later.'}
        </p>
        {category.transactionCount > 0 && (
          <label className={s.field}>
            Move transactions to
            <Select
              value={moveTo || '__none'}
              onValueChange={value => setMoveTo(value === '__none' ? '' : value)}
            >
              <SelectTrigger className={f.full}>
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
        <div className={s.actions}>
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
