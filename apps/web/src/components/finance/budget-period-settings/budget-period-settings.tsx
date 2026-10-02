'use client';

import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

import { movePeriod, resetPeriod, updateSettings } from '@/api/mutations';
import {
  Button,
  Cluster,
  DatePicker,
  Field,
  Panel,
  QueryContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SettingsSection,
  Text,
} from '@/components/ui';
import type { PeriodRuleValues, UserSettings } from '@coinkeeper/shared/schema/settings';

import { dayMonthLabel } from '../transaction-labels';
import {
  currentMonth,
  monthLabel,
  usePeriod,
  useRefreshFinance,
  useSettings,
} from '../use-finance-data';
import {
  DayOptions,
  type Option,
  parseWeekend,
  ruleFor,
  type RuleKind,
  RuleKindOptions,
  WeekendOptions,
  weekendValue,
  WorkingDayOptions,
} from './period-rule-form';

function Choice({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: Option[];
  value: string;
}) {
  return (
    <Field as="div">
      {label}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function RuleDetail({
  onChange,
  rule,
}: {
  onChange: (rule: PeriodRuleValues) => void;
  rule: PeriodRuleValues;
}) {
  if (rule.kind === 'fixed_day') {
    return (
      <Choice
        label="Day"
        options={DayOptions}
        value={String(rule.day)}
        onChange={day => onChange({ day: Number(day), kind: 'fixed_day' })}
      />
    );
  }

  if (rule.kind === 'before_month_end') {
    return (
      <Choice
        label="Which day"
        options={WorkingDayOptions}
        value={String(rule.workingDays)}
        onChange={days => onChange({ kind: 'before_month_end', workingDays: Number(days) })}
      />
    );
  }

  return null;
}

function RuleForm({ settings }: { settings: UserSettings }) {
  const refresh = useRefreshFinance();
  const [rule, setRule] = useState(settings.periodRule);
  const [weekend, setWeekend] = useState(weekendValue(settings.weekendDays));

  const save = useMutation({
    mutationFn: () => updateSettings({ periodRule: rule, weekendDays: parseWeekend(weekend) }),
    onError: (error: Error) => toast.error(error.message),
    onSuccess: async () => {
      toast.success('Budget period saved');
      await refresh();
    },
  });

  return (
    <SettingsSection
      title="When a period starts"
      description="Budgets and Home follow this period. A period is named after the month it ends in; a start on a weekend moves to the working day before."
    >
      <Choice
        label="Periods start"
        options={RuleKindOptions}
        value={rule.kind}
        onChange={kind => setRule(ruleFor(kind as RuleKind, rule))}
      />
      <RuleDetail rule={rule} onChange={setRule} />
      <Choice label="Weekend" options={WeekendOptions} value={weekend} onChange={setWeekend} />
      <Button disabled={save.isPending} onClick={() => save.mutate()}>
        Save
      </Button>
    </SettingsSection>
  );
}

function ThisPeriod() {
  const month = currentMonth();
  const refresh = useRefreshFinance();
  const period = usePeriod(month);

  const move = useMutation({
    mutationFn: (startsOn: string) => movePeriod(month, startsOn),
    onError: (error: Error) => toast.error(error.message),
    onSuccess: refresh,
  });

  const reset = useMutation({
    mutationFn: () => resetPeriod(month),
    onError: (error: Error) => toast.error(error.message),
    onSuccess: refresh,
  });

  return (
    <SettingsSection
      title="Move this period"
      description="Paid on a different day this time? Move the start of this period only; the rule still decides the next one."
    >
      <QueryContent pending={period.isPending} error={period.isError} loading="Loading the period…">
        {() =>
          period.data && (
            <>
              <Text>
                {monthLabel(month)}: {dayMonthLabel(period.data.from)} to{' '}
                {dayMonthLabel(period.data.to)}
                {period.data.moved && ` (moved from ${dayMonthLabel(period.data.ruleFrom)})`}
              </Text>
              <Cluster>
                <DatePicker
                  label="Start of this period"
                  value={period.data.from}
                  onChange={startsOn => startsOn && move.mutate(startsOn)}
                />
                {period.data.moved && (
                  <Button
                    variant="outline"
                    disabled={reset.isPending}
                    onClick={() => reset.mutate()}
                  >
                    Use the rule again
                  </Button>
                )}
              </Cluster>
            </>
          )
        }
      </QueryContent>
    </SettingsSection>
  );
}

export function BudgetPeriodSettings() {
  const settings = useSettings();

  return (
    <Panel title="Budget period">
      <QueryContent
        pending={settings.isPending}
        error={settings.isError}
        loading="Loading settings…"
      >
        {() => settings.data && <RuleForm settings={settings.data} />}
      </QueryContent>
      <ThisPeriod />
    </Panel>
  );
}
