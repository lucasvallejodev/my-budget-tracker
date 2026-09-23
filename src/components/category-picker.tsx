'use client';

import { CircleOffIcon } from 'lucide-react';
import { ComponentProps, useMemo, useState } from 'react';

import styles from '@/components/forms.module.scss';

import { CategoryTree, useCategories } from './finance/use-finance-data';
import { Icon } from './icon';
import { Button } from './primitives/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from './primitives/dialog';
import { Input } from './primitives/input';

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
      <div className={styles.colorIcon} style={{ backgroundColor: category.color }}>
        <Icon icon={category.icon} color="white" size={24} />
      </div>
      <div>{category.name}</div>
    </>
  );
}

const CategoryPicker = ({
  invalid,
  kind,
  onChange,
  value,
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
          className={styles.categoryTrigger}
          aria-invalid={invalid}
          {...triggerProps}
        >
          {selected ? (
            <div className={styles.categoryContent}>
              <CategoryChip category={selected} />
              <span className={styles.muted}>Click to change</span>
            </div>
          ) : (
            <div className={styles.categoryContent}>
              <CircleOffIcon className={styles.categoryIcon} />
              <span className={styles.muted}>
                {value ? 'Category unavailable' : 'No category (review later)'}
              </span>
            </div>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className={styles.form}>
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
            <div key={group.id} className={styles.categoryGroup}>
              <h3 style={{ color: group.color }}>{group.name}</h3>
              <div className={styles.categoryGrid}>
                {visible.map(category => (
                  <Button
                    key={category.id}
                    variant={value === category.id ? 'default' : 'outline'}
                    onClick={() => {
                      onChange(category.id);
                      setOpen(false);
                    }}
                    className={styles.categoryButton}
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
