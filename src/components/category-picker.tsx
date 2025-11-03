'use client';

import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { CATEGORIES_BY_GROUP, CATEGORY } from '@/constants/category';
import { Icon } from './icon';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from './ui/dialog';
import { CircleOffIcon } from 'lucide-react';
import { CategoryType } from '@/types/category';

type OnChangeCategoryProps = {
  categoryId: string;
  categoryGroupId: string;
};

type CategoryPickerProps = {
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

const CategoryPicker = ({ value, invalid, onChange }: CategoryPickerProps) => {
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>();

  useEffect(() => {
    if (value) {
      setSelectedCategory(getCategory(value));
    }
  }, [value]);

  const handleOnCategorySelect = (category: CategoryType, categoryGroupId: string) => {
    setSelectedCategory(category);
    onChange({ categoryId: category.id, categoryGroupId });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-[120px] w-full" aria-invalid={invalid}>
          {!!selectedCategory ? (
            <div className="flex flex-col items-center gap-2 p-4">
              <CategoryItem category={selectedCategory} />
              <span className="text-xs text-muted-foreground">Click to change</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <CircleOffIcon className="h-[48px] w-[48px]" />
              <span className="text-xs text-muted-foreground">Click to select</span>
            </div>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogTitle>Select a category</DialogTitle>
        {CATEGORIES_BY_GROUP.map((group: any) => (
          <div key={group.name} className="mb-4">
            <h3 className="font-semibold mb-2">{group.name}</h3>
            <div className="grid grid-cols-2 gap-2">
              {group.categories.map((category: CategoryType) => (
                <Button
                  key={category.id}
                  variant={value === category.id ? 'default' : 'outline'}
                  onClick={() => handleOnCategorySelect(category, group.id)}
                  className="flex items-center justify-center gap-2 flex-col h-full my-4"
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
    <div className={`rounded-lg p-2 bg-${category.color}`}>
      <Icon icon={category.icon} color="white" size={80} />
    </div>
    <div>{category.name}</div>
  </>
);

export default CategoryPicker;
