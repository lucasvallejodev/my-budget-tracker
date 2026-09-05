'use client';
import { ComponentProps, ReactNode, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from './command';
import s from '../forms.module.scss';
export type EntityPickerProps = Omit<ComponentProps<'button'>, 'value' | 'onChange'> & {
  value?: string;
  onChange?: (value: string) => void;
  invalid?: boolean;
};
export function EntityPicker({
  value = '',
  onChange,
  invalid,
  items,
  label,
  pending,
  error,
  create,
  ...props
}: EntityPickerProps & {
  items: { id: string; name: string }[];
  label: string;
  pending: boolean;
  error: boolean;
  create: (onCreated: (item: { id: string }) => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const select = (id: string) => {
    onChange?.(id);
    setOpen(false);
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={s.picker}
          aria-expanded={open}
          aria-invalid={invalid}
          {...props}
        >
          {items.find(item => item.id === value)?.name || `Select ${label}`}
          <ChevronsUpDown className={s.pickerIcon} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={s.pickerContent}>
        <Command>
          <CommandInput placeholder={`Search ${label}…`} />
          <CommandList>
            {pending ? (
              <p role="status">Loading…</p>
            ) : error ? (
              <p role="alert">Unable to load {label}. Close and try again.</p>
            ) : (
              <>
                <CommandEmpty>No {label} found.</CommandEmpty>
                {items.map(item => (
                  <CommandItem
                    key={item.id}
                    value={item.id}
                    keywords={[item.name]}
                    onSelect={() => select(item.id)}
                  >
                    {item.name}
                    {value === item.id && <Check className={s.check} />}
                  </CommandItem>
                ))}
              </>
            )}
          </CommandList>
        </Command>
        {create(item => select(item.id))}
      </PopoverContent>
    </Popover>
  );
}
