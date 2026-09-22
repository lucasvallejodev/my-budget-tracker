'use client';
import { useId, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import { Button } from './button';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import s from './calendar.module.scss';

export function DatePicker({
  label,
  value,
  onChange,
  min,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const selected = value ? parseISO(value) : undefined;
  const choose = (date?: Date) => {
    onChange(date ? format(date, 'yyyy-MM-dd') : '');
    setOpen(false);
  };
  return (
    <div className={s.field}>
      <label htmlFor={id}>{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button id={id} variant="outline" className={s.trigger}>
            <span>{selected ? format(selected, 'MMM d, yyyy') : 'Select date'}</span>
            <CalendarDays size={16} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className={s.popup} align="start" aria-label={`${label} date`}>
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected}
            disabled={min ? { before: parseISO(min) } : undefined}
            onSelect={choose}
            autoFocus
          />
          <div className={s.actions}>
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
