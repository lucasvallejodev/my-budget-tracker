'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftRight, Upload } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import AccountPicker from '@/app/(main)/_components/account-picker';
import { commitImportAction, linkTransferAction, previewImportAction } from '@/app/(main)/actions';
import { parseCsv } from '@/server/import/csv';
import type { ColumnMapping, Preview, TransferSuggestion } from '@/server/import/service';

import { flattenCategories } from '../category-picker';
import formStyles from '../forms.module.scss';
import { Amount } from '../money/amount';
import { Button } from '../primitives/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../primitives/select';
import { EmptyState, PageHeading, Panel, StatusBadge } from './blocks';
import styles from './finance.module.scss';
import { FinanceKeys, useCategories } from './use-finance-data';

const UnmappedColumnValue = '__none';

type PreviewRow = Preview['rows'][number];

function guess(headers: string[], candidates: string[]) {
  const lower = headers.map(header => header.toLowerCase());

  for (const candidate of candidates) {
    const index = lower.findIndex(header => header.includes(candidate));

    if (index >= 0) return headers[index];
  }

  return '';
}

function ColumnSelect({
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
    <label className={styles.field}>
      {label}
      <Select
        value={(mapping[field] as string) || UnmappedColumnValue}
        onValueChange={value => onChange(field, value === UnmappedColumnValue ? '' : value)}
      >
        <SelectTrigger className={formStyles.full} aria-label={label}>
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
    </label>
  );
}

const suggestionLabel = (row: PreviewRow, flat: { id: string; name: string }[]): string => {
  if (row.suggestedCategoryId) {
    const name = flat.find(category => category.id === row.suggestedCategoryId)?.name ?? 'Category';

    return `${name} (${row.suggestedBy})`;
  }

  return row.status === 'new' ? 'Review later' : '—';
};

export function ImportWizard() {
  const queryClient = useQueryClient();
  const categories = useCategories();
  const flat = useMemo(() => flattenCategories(categories.data), [categories.data]);
  const [accountId, setAccountId] = useState('');
  const [csv, setCsv] = useState('');
  const [fileName, setFileName] = useState('');
  const [mapping, setMapping] = useState<ColumnMapping>({ date: '', dateFormat: 'auto' });
  const [preview, setPreview] = useState<Preview | null>(null);

  const [result, setResult] = useState<{
    inserted: number;
    matched: number;
    suggestions: TransferSuggestion[];
  } | null>(null);

  const headers = useMemo(() => (csv ? parseCsv(csv).headers : []), [csv]);

  const setColumn = (field: keyof ColumnMapping, value: string) =>
    setMapping(current => ({ ...current, [field]: value }));

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const text = await file.text();
    const parsed = parseCsv(text);

    setCsv(text);
    setFileName(file.name);
    setPreview(null);
    setResult(null);
    setMapping({
      amount: guess(parsed.headers, ['amount', 'importe', 'cantidad', 'monto']),
      credit: guess(parsed.headers, ['credit', 'abono', 'deposit']),
      date: guess(parsed.headers, ['date', 'fecha']),
      dateFormat: 'auto',
      debit: guess(parsed.headers, ['debit', 'cargo', 'withdraw']),
      externalId: guess(parsed.headers, ['id', 'reference', 'referencia']),
      memo: guess(parsed.headers, ['memo', 'note', 'detail', 'observ']),
      payee: guess(parsed.headers, ['payee', 'description', 'concepto', 'merchant', 'name']),
    });
  };

  const runPreview = useMutation({
    mutationFn: () =>
      previewImportAction({
        accountId,
        csv,
        mapping,
      }),
    onError: (error: Error) => toast.error(error.message),
    onSuccess: setPreview,
  });

  const commit = useMutation({
    mutationFn: () => commitImportAction(preview!),
    onError: (error: Error) => toast.error(error.message),
    onSuccess: async data => {
      toast.success(`Imported ${data.inserted} transaction${data.inserted === 1 ? '' : 's'}`);
      setResult(data);
      setPreview(null);
      await Promise.all(FinanceKeys.map(key => queryClient.invalidateQueries({ queryKey: [key] })));
    },
  });

  const link = useMutation({
    mutationFn: (suggestion: TransferSuggestion) =>
      linkTransferAction(suggestion.outId, suggestion.inId),
    onError: (error: Error) => toast.error(error.message),
    onSuccess: async (result, suggestion) => {
      toast.success('Linked as a transfer');
      setResult(current =>
        current
          ? {
              ...current,
              suggestions: current.suggestions.filter(
                candidate => candidate.outId !== suggestion.outId
              ),
            }
          : current
      );
      await Promise.all(FinanceKeys.map(key => queryClient.invalidateQueries({ queryKey: [key] })));
    },
  });

  return (
    <div className={styles.page}>
      <PageHeading
        title="Import transactions"
        description="Upload a CSV export from your bank. Rows are matched against what you already entered, duplicates are skipped, and imported entries wait in the review inbox."
      />
      <Panel title="1 · Account and file">
        <div className={styles.filters}>
          <label className={styles.field}>
            Account
            <AccountPicker value={accountId} onChange={setAccountId} />
          </label>
          <label className={styles.field}>
            CSV file
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={event => void onFile(event.target.files?.[0])}
            />
          </label>
          {fileName && (
            <p className={styles.muted}>
              {fileName} · {headers.length} columns
            </p>
          )}
        </div>
      </Panel>
      {headers.length > 0 && (
        <Panel
          title="2 · Columns"
          description="Pick which column holds what. Either one signed amount column, or separate debit and credit columns."
        >
          <div className={styles.filters}>
            <ColumnSelect
              field="date"
              label="Date column"
              mapping={mapping}
              headers={headers}
              onChange={setColumn}
            />
            <label className={styles.field}>
              Date format
              <Select
                value={mapping.dateFormat ?? 'auto'}
                onValueChange={value =>
                  setMapping(current => ({
                    ...current,
                    dateFormat: value as ColumnMapping['dateFormat'],
                  }))
                }
              >
                <SelectTrigger className={formStyles.full} aria-label="Date format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="auto">Detect</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </label>
            <ColumnSelect
              field="amount"
              label="Amount column"
              mapping={mapping}
              headers={headers}
              onChange={setColumn}
            />
            <ColumnSelect
              field="debit"
              label="Debit column"
              mapping={mapping}
              headers={headers}
              onChange={setColumn}
            />
            <ColumnSelect
              field="credit"
              label="Credit column"
              mapping={mapping}
              headers={headers}
              onChange={setColumn}
            />
            <ColumnSelect
              field="payee"
              label="Payee column"
              mapping={mapping}
              headers={headers}
              onChange={setColumn}
            />
            <ColumnSelect
              field="memo"
              label="Memo column"
              mapping={mapping}
              headers={headers}
              onChange={setColumn}
            />
            <ColumnSelect
              field="externalId"
              label="Reference / id column"
              mapping={mapping}
              headers={headers}
              onChange={setColumn}
            />
            <label className={styles.field}>
              <span>
                <input
                  type="checkbox"
                  checked={!!mapping.invertSign}
                  onChange={event =>
                    setMapping(current => ({ ...current, invertSign: event.target.checked }))
                  }
                />{' '}
                Spending is positive in this file
              </span>
            </label>
          </div>
          <Button
            disabled={!accountId || !mapping.date || runPreview.isPending}
            onClick={() => runPreview.mutate()}
          >
            Preview
          </Button>
        </Panel>
      )}
      {preview && (
        <Panel
          title="3 · Preview"
          description={`${preview.counts.new} new · ${preview.counts.matched} matched to existing entries · ${preview.counts.duplicate} already imported · ${preview.counts.invalid} unreadable`}
          action={
            <Button
              disabled={commit.isPending || preview.counts.new + preview.counts.matched === 0}
              onClick={() => commit.mutate()}
            >
              <Upload size={16} /> Import {preview.counts.new} new
            </Button>
          }
        >
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Payee</th>
                  <th scope="col">Memo</th>
                  <th scope="col">Amount</th>
                  <th scope="col">Category</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map(row => (
                  <tr key={row.index}>
                    <td>{row.date ?? '—'}</td>
                    <td>{row.payee || '—'}</td>
                    <td>{row.memo || '—'}</td>
                    <td>
                      {row.amountMinor !== null ? (
                        <Amount amountMinor={row.amountMinor} currency={preview.currency} signed />
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>{suggestionLabel(row, flat)}</td>
                    <td>
                      {row.status === 'new' && <StatusBadge>New</StatusBadge>}
                      {row.status === 'matched' && (
                        <StatusBadge tone="neutral">Matches existing</StatusBadge>
                      )}
                      {row.status === 'duplicate' && (
                        <StatusBadge tone="warning">Already imported</StatusBadge>
                      )}
                      {row.status === 'invalid' && (
                        <StatusBadge tone="danger">{row.error}</StatusBadge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
      {result && (
        <Panel
          title="Done"
          description={`${result.inserted} imported, ${result.matched} matched to entries you had already recorded.`}
        >
          <p className={styles.muted}>
            Imported entries are pending and wait in the <Link href="/review">review inbox</Link>{' '}
            until you confirm their category.
          </p>
          {result.suggestions.length ? (
            <div className={styles.stack}>
              <h3>Possible transfers</h3>
              {result.suggestions.map(suggestion => (
                <div key={suggestion.outId} className={styles.row}>
                  <div>
                    <h3>
                      {suggestion.outAccount} → {suggestion.inAccount}
                    </h3>
                    <p>
                      <Amount amountMinor={suggestion.amountMinor} currency={suggestion.currency} />{' '}
                      · {suggestion.date}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={link.isPending}
                    onClick={() => link.mutate(suggestion)}
                  >
                    <ArrowLeftRight size={14} /> Link as transfer
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No transfer pairs detected" />
          )}
        </Panel>
      )}
    </div>
  );
}
