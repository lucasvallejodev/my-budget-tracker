import {
  DefaultWeekendDays,
  MAX_PERIOD_DAY,
  MAX_WORKING_DAYS_BEFORE_END,
  type PeriodRuleValues,
} from '@coinkeeper/shared/schema/settings';

export type Option = { label: string; value: string };

export type RuleKind = PeriodRuleValues['kind'];

export const RuleKindOptions: Option[] = [
  // keep order
  { label: 'On the 1st (calendar months)', value: 'calendar' },
  { label: 'On a fixed day of the month', value: 'fixed_day' },
  { label: 'On the last working days of the month', value: 'before_month_end' },
];

const DEFAULT_PAYDAY = 25;
const WeekendSeparator = ',';
const SUNDAY = 0;
const FRIDAY = 5;
const SATURDAY = 6;

export const WeekendOptions: Option[] = [
  // keep order
  { label: 'Saturday and Sunday', value: DefaultWeekendDays.join(WeekendSeparator) },
  { label: 'Friday and Saturday', value: [FRIDAY, SATURDAY].join(WeekendSeparator) },
  { label: 'Sunday only', value: String(SUNDAY) },
  { label: 'No weekend', value: '' },
];

export const DayOptions: Option[] = Array.from({ length: MAX_PERIOD_DAY }, (unused, index) => ({
  label: `Day ${index + 1}`,
  value: String(index + 1),
}));

const workingDayLabel = (index: number): string => {
  if (index === 0) return 'The last working day';

  return `${index} working day${index === 1 ? '' : 's'} before the last`;
};

export const WorkingDayOptions: Option[] = Array.from(
  { length: MAX_WORKING_DAYS_BEFORE_END + 1 },
  (unused, index) => ({
    label: workingDayLabel(index),
    value: String(index),
  })
);

export const weekendValue = (days: number[]): string => days.join(WeekendSeparator);

export const parseWeekend = (value: string): number[] =>
  value ? value.split(WeekendSeparator).map(Number) : [];

export const ruleFor = (kind: RuleKind, current: PeriodRuleValues): PeriodRuleValues => {
  if (kind === 'fixed_day') {
    return { day: current.kind === 'fixed_day' ? current.day : DEFAULT_PAYDAY, kind };
  }

  if (kind === 'before_month_end') {
    return { kind, workingDays: current.kind === 'before_month_end' ? current.workingDays : 0 };
  }

  return { kind: 'calendar' };
};
