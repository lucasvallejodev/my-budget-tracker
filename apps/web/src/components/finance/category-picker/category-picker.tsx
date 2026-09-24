'use client';

import './category-picker.scss';

import { CircleOffIcon } from 'lucide-react';
import { ComponentProps, useMemo, useState } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  Icon,
  Input,
  Text,
} from '@/components/ui';

import { CategoryTree, useCategories } from '../use-finance-data';

const ChipIconSize = 24;
const LeaveIconSize = 16;

type CategoryPickerProps = Omit<ComponentProps<'button'>, 'value' | 'onChange'> & {
  invalid?: boolean;
  kind?: 'income' | 'expense';
  onChange: (categoryId: string | undefined) => void;
  value?: string;
};

export type FlatCategory = {
  color: string;
  groupId: string;
  groupName: string;
  icon: string;
  id: string;
  kind: 'income' | 'expense';
  name: string;
};

export function flattenCategories(tree: CategoryTree[] | undefined): FlatCategory[] {
  return (tree ?? []).flatMap(group =>
    group.categories
      .filter(category => !category.archivedAt)
      .map(category => ({
        color: group.color,
        groupId: group.id,
        groupName: group.name,
        icon: category.icon,
        id: category.id,
        kind: group.kind,
        name: category.name,
      }))
  );
}

function CategoryChip({ category }: { category: Pick<FlatCategory, 'name' | 'icon' | 'color'> }) {
  return (
    <>
      <div className="category-picker__chip" style={{ backgroundColor: category.color }}>
        <Icon icon={category.icon} size={ChipIconSize} />
      </div>
      <div>{category.name}</div>
    </>
  );
}

function CategoryGroupOptions({
  group,
  onChoose,
  term,
  value,
}: {
  group: CategoryTree;
  onChoose: (categoryId: string) => void;
  term: string;
  value?: string;
}) {
  const visible = group.categories.filter(
    category => !category.archivedAt && (!term || category.name.toLowerCase().includes(term))
  );

  if (!visible.length) return null;

  return (
    <div className="category-picker__group">
      <h3 className="category-picker__group-title" style={{ color: group.color }}>
        {group.name}
      </h3>
      <div className="category-picker__grid">
        {visible.map(category => (
          <Button
            key={category.id}
            variant={value === category.id ? 'default' : 'outline'}
            onClick={() => onChoose(category.id)}
            className="category-picker__option"
          >
            <CategoryChip category={{ ...category, color: group.color }} />
          </Button>
        ))}
      </div>
    </div>
  );
}

export function CategoryPicker({
  invalid,
  kind,
  onChange,
  value,
  ...triggerProps
}: CategoryPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { data, isPending } = useCategories();
  const flat = useMemo(() => flattenCategories(data), [data]);
  const selected = flat.find(category => category.id === value);
  const groups = (data ?? []).filter(group => !kind || group.kind === kind);
  const term = search.trim().toLowerCase();

  const choose = (categoryId: string | undefined) => {
    onChange(categoryId);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="category-picker"
          aria-invalid={invalid}
          {...triggerProps}
        >
          <div className="category-picker__summary">
            {selected ? (
              <CategoryChip category={selected} />
            ) : (
              <CircleOffIcon className="category-picker__empty-icon" />
            )}
            <Text as="span" tone="muted" size="small">
              {selected && 'Click to change'}
              {!selected && (value ? 'Category unavailable' : 'No category (review later)')}
            </Text>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Select a category</DialogTitle>
        <Input
          aria-label="Search categories"
          placeholder="Search categories…"
          value={search}
          onChange={event => setSearch(event.target.value)}
        />
        {isPending && <p role="status">Loading categories…</p>}
        {groups.map(group => (
          <CategoryGroupOptions
            key={group.id}
            group={group}
            term={term}
            value={value}
            onChoose={choose}
          />
        ))}
        <Button variant="ghost" onClick={() => choose(undefined)}>
          <CircleOffIcon size={LeaveIconSize} /> Leave uncategorized
        </Button>
      </DialogContent>
    </Dialog>
  );
}
