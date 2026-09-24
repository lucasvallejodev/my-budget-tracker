'use client';

import { Amount, Badge, Table, TableCell, TableHeaderCell, TableRow } from '@/components/ui';
import type { Preview } from '@/schema/imports';

import type { FlatCategory } from '../category-picker';

type PreviewRow = Preview['rows'][number];

const suggestionLabel = (row: PreviewRow, flat: FlatCategory[]): string => {
  if (row.suggestedCategoryId) {
    const name = flat.find(category => category.id === row.suggestedCategoryId)?.name ?? 'Category';

    return `${name} (${row.suggestedBy})`;
  }

  return row.status === 'new' ? 'Review later' : '—';
};

function RowStatus({ row }: { row: PreviewRow }) {
  if (row.status === 'new') return <Badge>New</Badge>;
  if (row.status === 'matched') return <Badge tone="neutral">Matches existing</Badge>;
  if (row.status === 'duplicate') return <Badge tone="warning">Already imported</Badge>;

  return <Badge tone="danger">{row.error}</Badge>;
}

export function PreviewTable({ flat, preview }: { flat: FlatCategory[]; preview: Preview }) {
  return (
    <Table>
      <thead>
        <tr>
          <TableHeaderCell>Date</TableHeaderCell>
          <TableHeaderCell>Payee</TableHeaderCell>
          <TableHeaderCell>Memo</TableHeaderCell>
          <TableHeaderCell>Amount</TableHeaderCell>
          <TableHeaderCell>Category</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
        </tr>
      </thead>
      <tbody>
        {preview.rows.map(row => (
          <TableRow key={row.index}>
            <TableCell>{row.date ?? '—'}</TableCell>
            <TableCell>{row.payee || '—'}</TableCell>
            <TableCell>{row.memo || '—'}</TableCell>
            <TableCell>
              {row.amountMinor !== null ? (
                <Amount amountMinor={row.amountMinor} currency={preview.currency} signed />
              ) : (
                '—'
              )}
            </TableCell>
            <TableCell>{suggestionLabel(row, flat)}</TableCell>
            <TableCell>
              <RowStatus row={row} />
            </TableCell>
          </TableRow>
        ))}
      </tbody>
    </Table>
  );
}
