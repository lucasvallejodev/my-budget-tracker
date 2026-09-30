'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { ComponentProps, useMemo } from 'react';

import {
  Avatar,
  Button,
  Combobox,
  type ComboboxOption,
  type ComboboxSection,
  Icon,
} from '@/components/ui';
import { RememberedFields, rememberedList, rememberInList } from '@/lib/form-memory';

import { CategoryTree, useCategories } from '../use-finance-data';

const RecentCategoryLimit = 5;
const CategoriesPath = '/settings/categories';

export type FlatCategory = {
  color: string;
  groupId: string;
  groupName: string;
  icon: string;
  id: string;
  kind: 'income' | 'expense';
  name: string;
};

export type CategoryPickerVariant = 'chip' | 'field';

type CategoryPickerProps = Omit<
  ComponentProps<'button'>,
  'children' | 'onChange' | 'value' | 'placeholder'
> & {
  invalid?: boolean;
  kind?: 'income' | 'expense';
  label?: string;
  onChange: (categoryId: string | undefined) => void;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  placeholder?: string;
  suggestedId?: string | null;
  value?: string;
  variant?: CategoryPickerVariant;
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

function CategoryAvatar({ category }: { category: Pick<FlatCategory, 'color' | 'icon'> }) {
  return (
    <Avatar color={category.color} size="small">
      <Icon icon={category.icon} />
    </Avatar>
  );
}

const toOption = (category: FlatCategory): ComboboxOption => ({
  id: category.id,
  keywords: [category.groupName],
  label: category.name,
  leading: <CategoryAvatar category={category} />,
});

const pinnedSection = (
  id: string,
  heading: string,
  ids: string[],
  byId: Map<string, FlatCategory>
): ComboboxSection => ({
  heading,
  hideWhileSearching: true,
  id,
  options: ids.flatMap(categoryId => {
    const category = byId.get(categoryId);

    return category ? [{ ...toOption(category), hint: category.groupName }] : [];
  }),
});

const categorySections = (
  categories: FlatCategory[],
  suggestedId: string | null | undefined
): ComboboxSection[] => {
  const byId = new Map(categories.map(category => [category.id, category]));

  const recent = rememberedList(RememberedFields.recentCategories).filter(
    categoryId => categoryId !== suggestedId
  );

  const groups = [...new Set(categories.map(category => category.groupId))].map(groupId => {
    const members = categories.filter(category => category.groupId === groupId);

    return {
      heading: members[0].groupName,
      id: groupId,
      options: members.map(toOption),
    };
  });

  return [
    pinnedSection('suggested', 'Suggested', suggestedId ? [suggestedId] : [], byId),
    pinnedSection('recent', 'Recent', recent, byId),
    ...groups,
  ];
};

export function CategoryPicker({
  invalid,
  kind,
  label = 'Category',
  onChange,
  placeholder = 'Choose category',
  suggestedId,
  value,
  variant = 'field',
  ...comboboxProps
}: CategoryPickerProps) {
  const { data } = useCategories();

  const categories = useMemo(
    () => flattenCategories(data).filter(category => !kind || category.kind === kind),
    [data, kind]
  );

  const choose = (categoryId: string | undefined) => {
    if (categoryId) {
      rememberInList(RememberedFields.recentCategories, categoryId, RecentCategoryLimit);
    }

    onChange(categoryId);
  };

  return (
    <Combobox
      {...comboboxProps}
      label={label}
      placeholder={placeholder}
      searchPlaceholder="Type a category or group"
      emptyText="No category matches."
      clearLabel="Leave uncategorized"
      invalid={invalid}
      variant={variant}
      value={value}
      sections={categorySections(categories, suggestedId)}
      onChange={choose}
      footer={
        <Button asChild variant="ghost" size="sm">
          <Link href={CategoriesPath}>
            <Plus aria-hidden /> Create a category
          </Link>
        </Button>
      }
    />
  );
}
