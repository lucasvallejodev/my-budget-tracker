import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FileDrop } from './file-drop';

afterEach(cleanup);

const file = new File(['date,amount'], 'bank.csv', { type: 'text/csv' });

describe('FileDrop', () => {
  it('passes a chosen file through the labelled input', () => {
    const onFile = vi.fn();

    render(<FileDrop label="CSV file" accept=".csv" hint="CSV up to 5 MB" onFile={onFile} />);

    fireEvent.change(screen.getByLabelText('CSV file'), { target: { files: [file] } });

    expect(onFile).toHaveBeenCalledWith(file);
    expect(screen.getByText('CSV up to 5 MB')).toBeTruthy();
  });

  it('accepts a dropped file and highlights while dragging', () => {
    const onFile = vi.fn();

    const { container } = render(
      <FileDrop label="CSV file" accept=".csv" hint="CSV" onFile={onFile} fileName="old.csv" />
    );

    const zone = container.querySelector('.file-drop')!;

    fireEvent.dragOver(zone);

    expect(zone.className).toContain('file-drop--dragging');

    fireEvent.drop(zone, { dataTransfer: { files: [file] } });

    expect(onFile).toHaveBeenCalledWith(file);
    expect(zone.className).not.toContain('file-drop--dragging');
    expect(screen.getByText('old.csv')).toBeTruthy();
  });
});
