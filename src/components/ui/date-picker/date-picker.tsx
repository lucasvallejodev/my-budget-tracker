'use client';

import './date-picker.scss';

import { format, parseISO } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import { useId, useState } from 'react';

import { Button } from '../button';
import { Calendar } from '../calendar';
import { Field } from '../field';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';

const IsoDateFormat = 'yyyy-MM-dd';
const DisplayDateFormat = 'MMM d, yyyy';
const TriggerIconSize = 16;

export function DatePicker({
  label,
  min,
  onChange,
  value,
}: {
  label: string;
  min?: string;
  onChange: (value: string) => void;
  value: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const selected = value ? parseISO(value) : undefined;

  const choose = (date?: Date) => {
    onChange(date ? format(date, IsoDateFormat) : '');
    setOpen(false);
  };

  return (
    <Field as="div" variant="filter">
      <label htmlFor={id}>{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button id={id} variant="outline" className="date-picker__trigger">
            <span>{selected ? format(selected, DisplayDateFormat) : 'Select date'}</span>
            <CalendarDays size={TriggerIconSize} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="date-picker__popup" align="start" aria-label={`${label} date`}>
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected}
            disabled={min ? { before: parseISO(min) } : undefined}
            onSelect={choose}
            autoFocus
          />
          <div className="date-picker__actions">
            <Button variant="ghost" size="sm" onClick={() => choose()}>
              Clear
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={!!min && format(new Date(), IsoDateFormat) < min}
              onClick={() => choose(new Date())}
            >
              Today
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </Field>
  );
}
