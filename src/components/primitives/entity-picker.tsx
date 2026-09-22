'use client';
import { ComponentProps, ReactNode, useState } from 'react';
import { Check, ChevronsUpDown, PlusSquare } from 'lucide-react';
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
  create: (
    onCreated: (item: { id: string }) => void,
    dialogProps: {
      open: boolean;
      onOpenChange: (open: boolean) => void;
      onCloseAutoFocus: (event: Event) => void;
    }
  ) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [creationOpen, setCreationOpen] = useState(false);
  const [trigger, setTrigger] = useState<HTMLButtonElement | null>(null);
  const select = (id: string) => {
    onChange?.(id);
    setOpen(false);
  };
  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={s.picker}
            aria-expanded={open}
            aria-invalid={invalid}
            {...props}
            ref={setTrigger}
          >
            {items.find(item => item.id === value)?.name || `Select ${label}`}
            <ChevronsUpDown className={s.pickerIcon} />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={s.pickerContent}
          onCloseAutoFocus={event => {
            if (creationOpen) event.preventDefault();
          }}
        >
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
          <Button
            variant="ghost"
            className={s.create}
            onClick={() => {
              setOpen(false);
              setCreationOpen(true);
            }}
          >
            <PlusSquare size={16} />
            Create new
          </Button>
        </PopoverContent>
      </Popover>
      {create(
        item => {
          select(item.id);
          setCreationOpen(false);
        },
        {
          open: creationOpen,
          onOpenChange: setCreationOpen,
          onCloseAutoFocus: event => {
            event.preventDefault();
            trigger?.focus();
          },
        }
      )}
    </>
  );
}
