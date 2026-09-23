'use client';

import {
  Field,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import type { ColumnMapping } from '@/server/import/service';

const UnmappedColumnValue = '__none';

export const guessColumn = (headers: string[], candidates: string[]): string => {
  const lower = headers.map(header => header.toLowerCase());

  for (const candidate of candidates) {
    const index = lower.findIndex(header => header.includes(candidate));

    if (index >= 0) return headers[index];
  }

  return '';
};

export const guessMapping = (headers: string[]): ColumnMapping => ({
  amount: guessColumn(headers, ['amount', 'importe', 'cantidad', 'monto']),
  credit: guessColumn(headers, ['credit', 'abono', 'deposit']),
  date: guessColumn(headers, ['date', 'fecha']),
  dateFormat: 'auto',
  debit: guessColumn(headers, ['debit', 'cargo', 'withdraw']),
  externalId: guessColumn(headers, ['id', 'reference', 'referencia']),
  memo: guessColumn(headers, ['memo', 'note', 'detail', 'observ']),
  payee: guessColumn(headers, ['payee', 'description', 'concepto', 'merchant', 'name']),
});

export function ColumnSelect({
  field,
  headers,
  label,
  mapping,
  onChange,
}: {
  field: keyof ColumnMapping;
  headers: string[];
  label: string;
  mapping: ColumnMapping;
  onChange: (field: keyof ColumnMapping, value: string) => void;
}) {
  return (
    <Field variant="filter">
      {label}
      <Select
        value={(mapping[field] as string) || UnmappedColumnValue}
        onValueChange={value => onChange(field, value === UnmappedColumnValue ? '' : value)}
      >
        <SelectTrigger aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value={UnmappedColumnValue}>—</SelectItem>
            {headers.map(header => (
              <SelectItem key={header} value={header}>
                {header}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  );
}
