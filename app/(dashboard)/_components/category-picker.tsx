'use client';

import { useQuery } from '@tanstack/react-query';
import { TransactionType } from './types';
import { useEffect, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import CreateCategoryModal from './create-category-modal';
import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react';
import { CATEGORIES_BY_GROUP, CATEGORY } from '@/constants/categories';
import { CategoryIcon } from '@/components/category-icon';

type CategoryPickerProps = {
  type: TransactionType;
  onChange?: (category: string) => void;
};

function CategoryPicker({ type, onChange }: CategoryPickerProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string>('');

  const selectedCategory = Object.values(CATEGORY).find((cat: any) => cat.name === value);

  const categorySuccessCallback = (category: any) => {
    setValue(category.name);
    setOpen(false);
  };

  useEffect(() => {
    onChange?.(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" aria-expanded={open} className="w-full justify-between">
          {selectedCategory ? <CategoryRow category={selectedCategory} /> : 'Select a category'}
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full md:w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search categories..." />
          <CreateCategoryModal type={type} onSuccessCallback={categorySuccessCallback} />
          <CommandList>
            <CommandEmpty>No categories found.</CommandEmpty>
            <CommandGroup>
              <CommandList>
                {CATEGORIES_BY_GROUP.map((categoryGroup: any) => (
                  <>
                    <CommandItem
                          key={categoryGroup.id}
                          disabled
                        >
                      <span key={categoryGroup.name}>{categoryGroup.name}</span>
                    </CommandItem>
                    {
                      categoryGroup.categories.map((category: any) => (
                        <CommandItem
                          key={category.id}
                          onSelect={() => {
                            setOpen(false);
                            setValue(category.name);
                         }}
                        >
                          <CategoryRow category={category} />
                          {selectedCategory?.name === category.name && <CheckIcon className="ml-1" />}
                        </CommandItem>
                    ))}
                  </>
                ))}
              </CommandList>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function CategoryRow({ category }: { category: any }) {
  return (
    <div className="flex items-center gap-2">
      <CategoryIcon icon={category.icon} color={category.color} size={4} />
      <span>{category.name}</span>
    </div>
  );
}

export default CategoryPicker;
