'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeftRight, Upload } from 'lucide-react';
import { Panel, EmptyState, StatusBadge, PageHeading } from './blocks';
import { Button } from '../primitives/button';
import { Amount } from '../money/amount';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../primitives/select';
import AccountPicker from '@/app/(main)/_components/account-picker';
import { FinanceKeys, useCategories } from './use-finance-data';
import { flattenCategories } from '../category-picker';
import { parseCsv } from '@/server/import/csv';
import type { ColumnMapping, Preview, TransferSuggestion } from '@/server/import/service';
import { commitImportAction, linkTransferAction, previewImportAction } from '@/app/(main)/actions';
import s from './finance.module.scss';
import f from '../forms.module.scss';

const NONE = '__none';

function guess(headers: string[], candidates: string[]) {
  const lower = headers.map(h => h.toLowerCase());

  for (const candidate of candidates) {
    const index = lower.findIndex(h => h.includes(candidate));

    if (index >= 0) return headers[index];
  }

  return '';
}

function ColumnSelect({
  field,
  label,
  mapping,
  headers,
  onChange,
}: {
  field: keyof ColumnMapping;
  label: string;
  mapping: ColumnMapping;
  headers: string[];
  onChange: (field: keyof ColumnMapping, value: string) => void;
}) {
  return (
    <label className={s.field}>
      {label}
      <Select
        value={(mapping[field] as string) || NONE}
        onValueChange={value => onChange(field, value === NONE ? '' : value)}
      >
        <SelectTrigger className={f.full} aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value={NONE}>—</SelectItem>
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
      date: guess(parsed.headers, ['date', 'fecha']),
      amount: guess(parsed.headers, ['amount', 'importe', 'cantidad', 'monto']),
      debit: guess(parsed.headers, ['debit', 'cargo', 'withdraw']),
      credit: guess(parsed.headers, ['credit', 'abono', 'deposit']),
      payee: guess(parsed.headers, ['payee', 'description', 'concepto', 'merchant', 'name']),
      memo: guess(parsed.headers, ['memo', 'note', 'detail', 'observ']),
      externalId: guess(parsed.headers, ['id', 'reference', 'referencia']),
      dateFormat: 'auto',
    });
  };

  const runPreview = useMutation({
    mutationFn: () =>
      previewImportAction({
        accountId,
        csv,
        mapping,
      }),
    onSuccess: setPreview,
    onError: (error: Error) => toast.error(error.message),
  });

  const commit = useMutation({
    mutationFn: () => commitImportAction(preview!),
    onSuccess: async data => {
      toast.success(`Imported ${data.inserted} transaction${data.inserted === 1 ? '' : 's'}`);
      setResult(data);
      setPreview(null);
      await Promise.all(FinanceKeys.map(key => queryClient.invalidateQueries({ queryKey: [key] })));
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const link = useMutation({
    mutationFn: (suggestion: TransferSuggestion) =>
      linkTransferAction(suggestion.outId, suggestion.inId),
    onSuccess: async (_, suggestion) => {
      toast.success('Linked as a transfer');
      setResult(current =>
        current
          ? {
              ...current,
              suggestions: current.suggestions.filter(x => x.outId !== suggestion.outId),
            }
          : current
      );
      await Promise.all(FinanceKeys.map(key => queryClient.invalidateQueries({ queryKey: [key] })));
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className={s.page}>
      <PageHeading
        title="Import transactions"
        description="Upload a CSV export from your bank. Rows are matched against what you already entered, duplicates are skipped, and imported entries wait in the review inbox."
      />
      <Panel title="1 · Account and file">
        <div className={s.filters}>
          <label className={s.field}>
            Account
            <AccountPicker value={accountId} onChange={setAccountId} />
          </label>
          <label className={s.field}>
            CSV file
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={event => void onFile(event.target.files?.[0])}
            />
          </label>
          {fileName && (
            <p className={s.muted}>
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
          <div className={s.filters}>
            <ColumnSelect
              field="date"
              label="Date column"
              mapping={mapping}
              headers={headers}
              onChange={setColumn}
            />
            <label className={s.field}>
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
                <SelectTrigger className={f.full} aria-label="Date format">
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
            <label className={s.field}>
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
          <div className={s.tableWrap}>
            <table className={s.table}>
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
                    <td>
                      {row.suggestedCategoryId
                        ? `${flat.find(c => c.id === row.suggestedCategoryId)?.name ?? 'Category'} (${row.suggestedBy})`
                        : row.status === 'new'
                          ? 'Review later'
                          : '—'}
                    </td>
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
          <p className={s.muted}>
            Imported entries are pending and wait in the <Link href="/review">review inbox</Link>{' '}
            until you confirm their category.
          </p>
          {result.suggestions.length ? (
            <div className={s.stack}>
              <h3>Possible transfers</h3>
              {result.suggestions.map(suggestion => (
                <div key={suggestion.outId} className={s.row}>
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
