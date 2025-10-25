'use client';

import { ReactNode, useState } from 'react';
import { Button } from './ui/button';
import { CATEGORIES_BY_GROUP } from '@/constants/categories';
import { CategoryIcon } from './category-icon';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from './ui/dialog';

type CategoryPickerProps = {
  trigger: ReactNode;
  value?: string;
  onChange: (category: string | null) => void;
};

const CategoryPicker = ({ trigger, value, onChange }: CategoryPickerProps) => {
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(value);

  const handleOnCategorySelect = (category: string) => {
    setSelectedCategory(category);
    onChange(category);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogTitle>Select a category</DialogTitle>
        {CATEGORIES_BY_GROUP.map((group: any) => (
          <div key={group.name} className="mb-4">
            <h3 className="font-semibold mb-2">{group.name}</h3>
            <div className="grid grid-cols-2 gap-2">
              {group.categories.map((category: any) => (
                <Button
                  key={category.name}
                  variant={selectedCategory === category.name ? 'default' : 'outline'}
                  onClick={() => handleOnCategorySelect(category.name)}
                  className="flex items-center justify-center gap-2 flex-col h-full my-4"
                >
                  <div className={`rounded-lg p-2 bg-${category.color}`}>
                    <CategoryIcon icon={category.icon} color="white" size={80} />
                  </div>
                  <div>{category.name}</div>
                </Button>
              ))}
            </div>
          </div>
        ))}
      </DialogContent>
    </Dialog>
  );
};

export default CategoryPicker;
