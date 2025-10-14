'use client';

import 'react-day-picker/style.css';
import * as React from 'react';
import { DayPicker } from 'react-day-picker';

import { cn } from '@/lib/utils';

function Calendar({ className, classNames, ...props }: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays
      className={cn('p-3', className)}
      classNames={{
        chevron: 'rounded-md w-8 h-8 p-2',
        month: 'flex flex-col gap-4',
        month_caption: 'flex items-center pt-2.5',
        day: cn('size-8 p-0 text-center'),
        selected: 'bg-blue-800 text-primary-foreground rounded-md',
        day_button: 'w-full h-full rounded-md',
        today: 'bg-accent text-accent-foreground rounded-md',
        ...classNames,
      }}
      {...props}
    />
  );
}

export { Calendar };
