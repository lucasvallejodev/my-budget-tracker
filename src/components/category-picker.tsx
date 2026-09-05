'use client';
import s from '@/components/forms.module.scss';

import { ComponentProps, useState } from 'react';
import { Button } from './primitives/button';
import { CATEGORIES_BY_GROUP, CATEGORY } from '@/constants/category';
import { Icon } from './icon';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from './primitives/dialog';
import { CircleOffIcon } from 'lucide-react';
import { CategoryType } from '@/types/category';

type OnChangeCategoryProps = {
  categoryId: string;
  categoryGroupId: string;
};

type CategoryPickerProps = Omit<ComponentProps<'button'>, 'value' | 'onChange'> & {
  value?: string;
  invalid?: boolean;
  onChange: (values: OnChangeCategoryProps) => void;
};

const getCategory = (categoryId: string): CategoryType => {
  const category = CATEGORY[categoryId as keyof typeof CATEGORY];

  if (!category) {
    return CATEGORY['uncategorized'];
  }

  return category;
};

const CategoryPicker = ({ value, invalid, onChange, ...triggerProps }: CategoryPickerProps) => {
  const [open, setOpen] = useState(false);
  const selectedCategory = value ? getCategory(value) : undefined;

  const handleOnCategorySelect = (category: CategoryType, categoryGroupId: string) => {
    onChange({ categoryId: category.id, categoryGroupId });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={s.categoryTrigger}
          aria-invalid={invalid}
          {...triggerProps}
        >
          {!!selectedCategory ? (
            <div className={s.categoryContent}>
              <CategoryItem category={selectedCategory} />
              <span className={s.muted}>Click to change</span>
            </div>
          ) : (
            <div className={s.categoryContent}>
              <CircleOffIcon className={s.categoryIcon} />
              <span className={s.muted}>Click to select</span>
            </div>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className={s.form}>
        <DialogTitle>Select a category</DialogTitle>
        {CATEGORIES_BY_GROUP.map((group: any) => (
          <div key={group.name} className={s.categoryGroup}>
            <h3 className={s.categoryGroup}>{group.name}</h3>
            <div className={s.categoryGrid}>
              {group.categories.map((category: CategoryType) => (
                <Button
                  key={category.id}
                  variant={value === category.id ? 'default' : 'outline'}
                  onClick={() => handleOnCategorySelect(category, group.id)}
                  className={s.categoryButton}
                >
                  <CategoryItem category={category} />
                </Button>
              ))}
            </div>
          </div>
        ))}
      </DialogContent>
    </Dialog>
  );
};

const CategoryItem = ({ category }: { category: any }) => (
  <>
    <div className={s.colorIcon} style={{ backgroundColor: category.color }}>
      <Icon icon={category.icon} color="white" size={24} />
    </div>
    <div>{category.name}</div>
  </>
);

export default CategoryPicker;
