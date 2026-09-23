'use client';

import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

import { useEntityMutation } from '@/app/(main)/_components/use-entity-mutation';
import {
  archiveCategoryAction,
  createCategoryAction,
  createCategoryGroupAction,
  updateCategoryAction,
  updateCategoryGroupAction,
} from '@/app/(main)/actions';
import {
  Button,
  Cluster,
  ColorPicker,
  Dialog,
  DialogContent,
  DialogTitle,
  Field,
  FormStack,
  IconPicker,
  Input,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
} from '@/components/ui';
import { IconName } from '@/constants/icons';
import { Colors } from '@/styles/theme';

import type { Category, Group, GroupKind } from './category-types';

const NameMaxLength = 50;
const DefaultCategoryIcon = 'Shapes';
const KeepUncategorizedValue = '__none';

const NewGroup: Pick<Group, 'name' | 'kind' | 'color'> = {
  color: Colors.group.blue,
  kind: 'expense',
  name: '',
};

const archiveDescription = (count: number, groupName: string): string => {
  if (!count) {
    return 'This category has no transactions. It disappears from pickers but can be restored later.';
  }

  const noun = count === 1 ? 'transaction' : 'transactions';

  return `${count} ${noun} use this category in ${groupName}. Move them to another category, or keep them and they will reappear in the review inbox.`;
};

function NameField({ onChange, value }: { onChange: (value: string) => void; value: string }) {
  return (
    <Field>
      Name
      <Input
        value={value}
        onChange={event => onChange(event.target.value)}
        required
        maxLength={NameMaxLength}
      />
    </Field>
  );
}

export function GroupDialog({
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
  const [kind, setKind] = useState<GroupKind>(initial.kind);
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
        <FormStack
          onSubmit={event => {
            event.preventDefault();
            save.mutate();
          }}
        >
          <NameField value={name} onChange={setName} />
          <Field>
            Kind
            <Select
              value={kind}
              disabled={group?.isSystem}
              onValueChange={value => setKind(value as GroupKind)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field as="div">
            Colour (shared by every category in the group)
            <ColorPicker value={color} onChange={setColor} />
          </Field>
          <Button type="submit" disabled={save.isPending || !name.trim()}>
            {group ? 'Save' : 'Create group'}
          </Button>
        </FormStack>
      </DialogContent>
    </Dialog>
  );
}

export function CategoryDialog({
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
  const [icon, setIcon] = useState<string>(category?.icon ?? DefaultCategoryIcon);
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
        <FormStack
          onSubmit={event => {
            event.preventDefault();
            save.mutate();
          }}
        >
          <NameField value={name} onChange={setName} />
          <Field>
            Group
            <Select value={group} onValueChange={setGroup}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {groups.map(option => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field as="div">
            Icon
            <IconPicker value={icon} onChange={setIcon} color={color} />
          </Field>
          <Button type="submit" disabled={save.isPending || !name.trim()}>
            {category ? 'Save' : 'Create category'}
          </Button>
        </FormStack>
      </DialogContent>
    </Dialog>
  );
}

export function ArchiveDialog({
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

  const options = groups.flatMap(candidateGroup =>
    candidateGroup.categories
      .filter(candidate => !candidate.archivedAt && candidate.id !== category.id)
      .map(candidate => ({
        id: candidate.id,
        label: `${candidateGroup.name} › ${candidate.name}`,
      }))
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
        <Text tone="muted">{archiveDescription(category.transactionCount, group.name)}</Text>
        {category.transactionCount > 0 && (
          <Field>
            Move transactions to
            <Select
              value={moveTo || KeepUncategorizedValue}
              onValueChange={value => setMoveTo(value === KeepUncategorizedValue ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value={KeepUncategorizedValue}>
                    Keep uncategorized (review later)
                  </SelectItem>
                  {options.map(option => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        )}
        <Cluster>
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
        </Cluster>
      </DialogContent>
    </Dialog>
  );
}
