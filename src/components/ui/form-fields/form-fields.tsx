'use client';

import './form-fields.scss';

import { format, parseISO } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { ComponentProps, ReactNode, useState } from 'react';
import { Control, FieldPath, FieldValues } from 'react-hook-form';

import { Button } from '../button';
import { Calendar } from '../calendar';
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '../form';
import { Input } from '../input';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';

const IsoDateFormat = 'yyyy-MM-dd';
const LongDateFormat = 'PPP';

export type FormFieldProps<T extends FieldValues> = {
  control: Control<T>;
  description: ReactNode;
  label: ReactNode;
  name: FieldPath<T>;
};

type InputProps = Omit<ComponentProps<typeof Input>, 'name' | 'value' | 'onChange'>;

export function TextField<T extends FieldValues>({
  control,
  description,
  label,
  name,
  ...input
}: FormFieldProps<T> & InputProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input type="text" {...input} {...field} />
          </FormControl>
          <FormDescription>{description}</FormDescription>
        </FormItem>
      )}
    />
  );
}

export function AmountField<T extends FieldValues>(props: FormFieldProps<T>) {
  return <TextField inputMode="decimal" placeholder="0.00" autoComplete="off" {...props} />;
}

function DatePopover({ onChange, value }: { onChange: (value: string) => void; value: string }) {
  const [open, setOpen] = useState(false);
  const selected = value ? parseISO(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <FormControl>
          <Button type="button" variant="outline" className="form-fields__date-button">
            {selected ? format(selected, LongDateFormat) : 'Select a date'}
            <CalendarIcon className="form-fields__date-icon" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="form-fields__date-popover">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={date => {
            if (date) onChange(format(date, IsoDateFormat));
            setOpen(false);
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export function DateField<T extends FieldValues>({
  control,
  description,
  label = 'Date',
  name,
}: Omit<FormFieldProps<T>, 'label'> & { label?: ReactNode }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <DatePopover value={field.value} onChange={field.onChange} />
          <FormDescription>{description}</FormDescription>
        </FormItem>
      )}
    />
  );
}
