"use client"

import { useQuery } from "@tanstack/react-query";
import { TransactionType } from "./types";
import { useState } from "react";
import { Category } from "@prisma/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import CreateCategoryModal from "./CreateCategoryModal";

type CategoryPickerProps = {
  type: TransactionType
}

function CategoryPicker({ type }: CategoryPickerProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string>("");

  const categoriesQuery = useQuery({
    queryKey: ["categories", type],
    queryFn: () => fetch(`/api/categories?type=${type}`).then((res) => res.json()),
  });

  const selectedCategory = categoriesQuery.data?.find((category: Category) => category.name === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" aria-expanded={open} className="w-[200px] justify-between">
          {selectedCategory ?<CategoryRow category={selectedCategory} /> : "Select a category"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search categories..." />
          <CreateCategoryModal type={type} />
          <CommandList>
            <CommandEmpty>No categories found.</CommandEmpty>
            <CommandGroup>
              {categoriesQuery.data?.map((category: Category) => (
                <CommandItem
                  key={category.name}
                  onSelect={(currentValue) => {
                    setValue(currentValue);
                    setOpen(false);
                  }}
                >
                  <CategoryRow category={category} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function CategoryRow({ category }: { category: Category }) {
  return (
    <div className="flex items-center gap-2">
      <span role="img">{category.icon}</span>
      <span>{category.name}</span>
    </div>
  );
}

export default CategoryPicker

