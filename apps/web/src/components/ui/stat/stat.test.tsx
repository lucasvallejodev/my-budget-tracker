import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Stat } from './stat';

afterEach(cleanup);

describe('Stat', () => {
  it('shows a label, a value and a meta line', () => {
    render(<Stat label="Income" value="€3,000.00" meta="Same as August" leading={<i>icon</i>} />);

    expect(screen.getByText('Income')).toBeTruthy();
    expect(screen.getByText('€3,000.00').className).toBe('stat__value');
    expect(screen.getByText('Same as August')).toBeTruthy();
    expect(screen.getByText('icon')).toBeTruthy();
  });

  it('colours a change by whether it is good, not by its direction', () => {
    render(
      <Stat
        label="Spending"
        value="€2,154.39"
        size="hero"
        delta={{
          good: true,
          label: '5.6%',
          rising: false,
        }}
        meta="vs August"
      />
    );

    expect(screen.getByText('5.6%').className).toBe('stat__delta');
    expect(screen.getByText('€2,154.39').parentElement?.className).toBe('stat stat--hero');
  });

  it('marks a bad change', () => {
    render(
      <Stat
        label="Owed"
        value="€1"
        delta={{
          good: false,
          label: '€40',
          rising: true,
        }}
      />
    );

    expect(screen.getByText('€40').className).toBe('stat__delta stat__delta--bad');
  });
});
