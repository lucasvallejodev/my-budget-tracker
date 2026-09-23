'use client';

import s from '@/components/forms.module.scss';

import { ComponentProps, useMemo, useState } from 'react';
import { Button } from './primitives/button';
import { Icon } from './icon';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from './primitives/dialog';
import { Input } from './primitives/input';
import { CircleOffIcon } from 'lucide-react';
import { CategoryTree, useCategories } from './finance/use-finance-data';

type CategoryPickerProps = Omit<ComponentProps<'button'>, 'value' | 'onChange'> & {
  value?: string;
  invalid?: boolean;
  /** Restrict to income or expense groups; omit for both. */
  kind?: 'income' | 'expense';
  onChange: (categoryId: string | undefined) => void;
};

export type FlatCategory = {
  id: string;
  name: string;
  icon: string;
  groupId: string;
  groupName: string;
  color: string;
  kind: 'income' | 'expense';
};

export function flattenCategories(tree: CategoryTree[] | undefined): FlatCategory[] {
  return (tree ?? []).flatMap(group =>
    group.categories
      .filter(category => !category.archivedAt)
      .map(category => ({
        id: category.id,
        name: category.name,
        icon: category.icon,
        groupId: group.id,
        groupName: group.name,
        color: group.color,
        kind: group.kind,
      }))
  );
}

export function CategoryChip({
  category,
}: {
  category: Pick<FlatCategory, 'name' | 'icon' | 'color'>;
}) {
  return (
    <>
      <div className={s.colorIcon} style={{ backgroundColor: category.color }}>
        <Icon icon={category.icon} color="white" size={24} />
      </div>
      <div>{category.name}</div>
    </>
  );
}

const CategoryPicker = ({
  value,
  invalid,
  kind,
  onChange,
  ...triggerProps
}: CategoryPickerProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { data, isPending } = useCategories();
  const flat = useMemo(() => flattenCategories(data), [data]);
  const selected = flat.find(category => category.id === value);
  const groups = (data ?? []).filter(group => !kind || group.kind === kind);
  const term = search.trim().toLowerCase();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={s.categoryTrigger}
          aria-invalid={invalid}
          {...triggerProps}
        >
          {selected ? (
            <div className={s.categoryContent}>
              <CategoryChip category={selected} />
              <span className={s.muted}>Click to change</span>
            </div>
          ) : (
            <div className={s.categoryContent}>
              <CircleOffIcon className={s.categoryIcon} />
              <span className={s.muted}>
                {value ? 'Category unavailable' : 'No category (review later)'}
              </span>
            </div>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className={s.form}>
        <DialogTitle>Select a category</DialogTitle>
        <Input
          aria-label="Search categories"
          placeholder="Search categories…"
          value={search}
          onChange={event => setSearch(event.target.value)}
        />
        {isPending && <p role="status">Loading categories…</p>}
        {groups.map(group => {
          const visible = group.categories.filter(
            category =>
              !category.archivedAt && (!term || category.name.toLowerCase().includes(term))
          );

          if (!visible.length) return null;

          return (
            <div key={group.id} className={s.categoryGroup}>
              <h3 style={{ color: group.color }}>{group.name}</h3>
              <div className={s.categoryGrid}>
                {visible.map(category => (
                  <Button
                    key={category.id}
                    variant={value === category.id ? 'default' : 'outline'}
                    onClick={() => {
                      onChange(category.id);
                      setOpen(false);
                    }}
                    className={s.categoryButton}
                  >
                    <CategoryChip category={{ ...category, color: group.color }} />
                  </Button>
                ))}
              </div>
            </div>
          );
        })}
        <Button
          variant="ghost"
          onClick={() => {
            onChange(undefined);
            setOpen(false);
          }}
        >
          <CircleOffIcon size={16} /> Leave uncategorized
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryPicker;
