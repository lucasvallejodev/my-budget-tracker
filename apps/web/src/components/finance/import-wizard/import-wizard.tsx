'use client';

import { useMutation } from '@tanstack/react-query';
import { ArrowLeftRight, Upload } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { commitImport, linkTransfer, previewImport } from '@/api/mutations';
import {
  Amount,
  Button,
  EmptyState,
  Field,
  FilterBar,
  ListRow,
  Page,
  PageHeading,
  Panel,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
  Text,
} from '@/components/ui';
import { parseCsv } from '@coinkeeper/shared/lib/csv';
import type { ColumnMapping, Preview, TransferSuggestion } from '@coinkeeper/shared/schema/imports';

import { AccountPicker } from '../account-picker';
import { flattenCategories } from '../category-picker';
import { useCategories, useRefreshFinance } from '../use-finance-data';
import { ColumnSelect, guessMapping } from './column-select';
import { PreviewTable } from './preview-table';

const UploadIconSize = 16;
const LinkIconSize = 14;

const MappedColumns: { field: keyof ColumnMapping; label: string }[] = [
  // keep order
  { field: 'amount', label: 'Amount column' },
  { field: 'debit', label: 'Debit column' },
  { field: 'credit', label: 'Credit column' },
  { field: 'payee', label: 'Payee column' },
  { field: 'memo', label: 'Memo column' },
  { field: 'externalId', label: 'Reference / id column' },
];

type ImportResult = {
  inserted: number;
  matched: number;
  suggestions: TransferSuggestion[];
};

function TransferSuggestions({
  onLink,
  pending,
  suggestions,
}: {
  onLink: (suggestion: TransferSuggestion) => void;
  pending: boolean;
  suggestions: TransferSuggestion[];
}) {
  if (!suggestions.length) return <EmptyState title="No transfer pairs detected" />;

  return (
    <Stack>
      <h3>Possible transfers</h3>
      {suggestions.map(suggestion => (
        <ListRow
          key={suggestion.outId}
          title={`${suggestion.outAccount} → ${suggestion.inAccount}`}
          description={
            <>
              <Amount amountMinor={suggestion.amountMinor} currency={suggestion.currency} /> ·{' '}
              {suggestion.date}
            </>
          }
        >
          <Button variant="outline" size="sm" disabled={pending} onClick={() => onLink(suggestion)}>
            <ArrowLeftRight size={LinkIconSize} /> Link as transfer
          </Button>
        </ListRow>
      ))}
    </Stack>
  );
}

export function ImportWizard() {
  const refresh = useRefreshFinance();
  const categories = useCategories();
  const flat = useMemo(() => flattenCategories(categories.data), [categories.data]);
  const [accountId, setAccountId] = useState('');
  const [csv, setCsv] = useState('');
  const [fileName, setFileName] = useState('');
  const [mapping, setMapping] = useState<ColumnMapping>({ date: '', dateFormat: 'auto' });
  const [preview, setPreview] = useState<Preview | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const headers = useMemo(() => (csv ? parseCsv(csv).headers : []), [csv]);

  const setColumn = (field: keyof ColumnMapping, value: string) =>
    setMapping(current => ({ ...current, [field]: value }));

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const text = await file.text();

    setCsv(text);
    setFileName(file.name);
    setPreview(null);
    setResult(null);
    setMapping(guessMapping(parseCsv(text).headers));
  };

  const runPreview = useMutation({
    mutationFn: () =>
      previewImport({
        accountId,
        csv,
        mapping,
      }),
    onError: (error: Error) => toast.error(error.message),
    onSuccess: setPreview,
  });

  const commit = useMutation({
    mutationFn: () => commitImport(preview!),
    onError: (error: Error) => toast.error(error.message),
    onSuccess: async data => {
      toast.success(`Imported ${data.inserted} transaction${data.inserted === 1 ? '' : 's'}`);
      setResult(data);
      setPreview(null);
      await refresh();
    },
  });

  const link = useMutation({
    mutationFn: (suggestion: TransferSuggestion) => linkTransfer(suggestion.outId, suggestion.inId),
    onError: (error: Error) => toast.error(error.message),
    onSuccess: async (linked, suggestion) => {
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
      await refresh();
    },
  });

  return (
    <Page>
      <PageHeading
        title="Import transactions"
        description="Upload a CSV export from your bank. Rows are matched against what you already entered, duplicates are skipped, and imported entries wait in the review inbox."
      />
      <Panel title="1 · Account and file">
        <FilterBar>
          <Field variant="filter">
            Account
            <AccountPicker value={accountId} onChange={setAccountId} />
          </Field>
          <Field variant="filter">
            CSV file
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={event => void onFile(event.target.files?.[0])}
            />
          </Field>
          {fileName && (
            <Text tone="muted">
              {fileName} · {headers.length} columns
            </Text>
          )}
        </FilterBar>
      </Panel>
      {headers.length > 0 && (
        <Panel
          title="2 · Columns"
          description="Pick which column holds what. Either one signed amount column, or separate debit and credit columns."
        >
          <FilterBar>
            <ColumnSelect
              field="date"
              label="Date column"
              mapping={mapping}
              headers={headers}
              onChange={setColumn}
            />
            <Field variant="filter">
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
                <SelectTrigger aria-label="Date format">
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
            </Field>
            {MappedColumns.map(column => (
              <ColumnSelect
                key={column.field}
                field={column.field}
                label={column.label}
                mapping={mapping}
                headers={headers}
                onChange={setColumn}
              />
            ))}
            <Field variant="filter">
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
            </Field>
          </FilterBar>
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
              <Upload size={UploadIconSize} /> Import {preview.counts.new} new
            </Button>
          }
        >
          <PreviewTable preview={preview} flat={flat} />
        </Panel>
      )}
      {result && (
        <Panel
          title="Done"
          description={`${result.inserted} imported, ${result.matched} matched to entries you had already recorded.`}
        >
          <Text tone="muted">
            Imported entries are pending and wait in the <Link href="/review">review inbox</Link>{' '}
            until you confirm their category.
          </Text>
          <TransferSuggestions
            suggestions={result.suggestions}
            pending={link.isPending}
            onLink={suggestion => link.mutate(suggestion)}
          />
        </Panel>
      )}
    </Page>
  );
}
