'use client';

import './entity-picker.scss';

import { Check, ChevronsUpDown } from 'lucide-react';
import { ComponentProps, ReactNode, useState } from 'react';

import { cn } from '@/lib/styles';

import { Button } from '../button';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '../command';
import { CreateNewButton } from '../create-new-button';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';

export type EntityPickerProps = Omit<ComponentProps<'button'>, 'value' | 'onChange'> & {
  invalid?: boolean;
  onChange?: (value: string) => void;
  value?: string;
};

export function EntityPicker({
  className,
  create,
  error,
  invalid,
  items,
  label,
  onChange,
  pending,
  value = '',
  ...props
}: EntityPickerProps & {
  create: (
    onCreated: (item: { id: string }) => void,
    dialogProps: {
      onCloseAutoFocus: (event: Event) => void;
      onOpenChange: (open: boolean) => void;
      open: boolean;
    }
  ) => ReactNode;
  error: boolean;
  items: { id: string; name: string }[];
  label: string;
  pending: boolean;
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
            className={cn('entity-picker', className)}
            aria-expanded={open}
            aria-invalid={invalid}
            {...props}
            ref={setTrigger}
          >
            {items.find(item => item.id === value)?.name || `Select ${label}`}
            <ChevronsUpDown className="entity-picker__icon" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="entity-picker__content"
          onCloseAutoFocus={event => {
            if (creationOpen) event.preventDefault();
          }}
        >
          <Command>
            <CommandInput placeholder={`Search ${label}…`} />
            <CommandList>
              {pending && <p role="status">Loading…</p>}
              {!pending && error && (
                <p role="alert">Unable to load {label}. Close and try again.</p>
              )}
              {!pending && !error && (
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
                      {value === item.id && <Check className="entity-picker__check" />}
                    </CommandItem>
                  ))}
                </>
              )}
            </CommandList>
          </Command>
          <CreateNewButton
            onClick={() => {
              setOpen(false);
              setCreationOpen(true);
            }}
          />
        </PopoverContent>
      </Popover>
      {create(
        item => {
          select(item.id);
          setCreationOpen(false);
        },
        {
          onCloseAutoFocus: event => {
            event.preventDefault();
            trigger?.focus();
          },
          onOpenChange: setCreationOpen,
          open: creationOpen,
        }
      )}
    </>
  );
}
