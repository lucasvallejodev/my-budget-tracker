import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Table, TableCell, TableHeaderCell, TableRow } from './table';

afterEach(cleanup);

describe('Table', () => {
  it('renders column headers and cells', () => {
    render(
      <Table label="Exchange rates">
        <thead>
          <tr>
            <TableHeaderCell>Rate</TableHeaderCell>
          </tr>
        </thead>
        <tbody>
          <TableRow>
            <TableCell>1.08</TableCell>
          </TableRow>
        </tbody>
      </Table>
    );

    expect(screen.getByRole('columnheader', { name: 'Rate' }).getAttribute('scope')).toBe('col');
    expect(screen.getByRole('cell', { name: '1.08' })).toBeTruthy();
  });

  it('makes the scrollable wrapper a named region reachable with the keyboard', () => {
    render(
      <Table label="Exchange rates">
        <tbody>
          <TableRow>
            <TableCell>1.08</TableCell>
          </TableRow>
        </tbody>
      </Table>
    );

    expect(screen.getByRole('region', { name: 'Exchange rates' }).tabIndex).toBe(0);
  });
});
