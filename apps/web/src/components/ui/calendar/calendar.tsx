'use client';

import './calendar.scss';

import {
  DayFlag,
  DayPicker,
  DayPickerProps,
  getDefaultClassNames,
  SelectionState,
  UI,
} from 'react-day-picker';

const RootKey: string = UI.Root;
const DayStateKeys: string[] = [...Object.values(DayFlag), ...Object.values(SelectionState)];
const DayPickerSeparator = '_';
const BemWordSeparator = '-';

const calendarClassName = (key: string) => {
  if (key === RootKey) return 'calendar';
  const name = key.replaceAll(DayPickerSeparator, BemWordSeparator);

  return DayStateKeys.includes(key) ? `calendar__day calendar__day--${name}` : `calendar__${name}`;
};

export function Calendar(props: DayPickerProps) {
  const classNames = Object.fromEntries(
    Object.keys(getDefaultClassNames()).map(key => [key, calendarClassName(key)])
  );

  return <DayPicker classNames={classNames} {...props} />;
}
