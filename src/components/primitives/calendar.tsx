'use client';

import { DayPicker, DayPickerProps, getDefaultClassNames } from 'react-day-picker';

import styles from './calendar.module.scss';

export function Calendar(props: DayPickerProps) {
  const defaults = getDefaultClassNames();
  const classNames = Object.fromEntries(Object.keys(defaults).map(key => [key, styles[key] || '']));

  return <DayPicker classNames={classNames} {...props} />;
}
