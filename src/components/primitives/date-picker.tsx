'use client';

import { format, parseISO } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import { useId, useState } from 'react';

import { Button } from './button';
import { Calendar } from './calendar';
import styles from './calendar.module.scss';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

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
    onChange(date ? format(date, 'yyyy-MM-dd') : '');
    setOpen(false);
  };

  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button id={id} variant="outline" className={styles.trigger}>
            <span>{selected ? format(selected, 'MMM d, yyyy') : 'Select date'}</span>
            <CalendarDays size={16} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className={styles.popup} align="start" aria-label={`${label} date`}>
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected}
            disabled={min ? { before: parseISO(min) } : undefined}
            onSelect={choose}
            autoFocus
          />
          <div className={styles.actions}>
            <Button variant="ghost" size="sm" onClick={() => choose()}>
              Clear
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={!!min && format(new Date(), 'yyyy-MM-dd') < min}
              onClick={() => choose(new Date())}
            >
              Today
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
