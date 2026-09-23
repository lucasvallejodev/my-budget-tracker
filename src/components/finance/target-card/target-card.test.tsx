import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('recharts', async importOriginal => ({
  ...(await importOriginal<typeof import('recharts')>()),
  ResponsiveContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

import { TargetCard } from './target-card';

afterEach(cleanup);

describe('TargetCard', () => {
  it('shows the share of the target reached', () => {
    render(<TargetCard value={4480} target={10000} />);

    expect(screen.getByRole('img', { name: '45% of income target' })).toBeTruthy();
    expect(screen.getByText('$4,480.00 of $10,000.00')).toBeTruthy();
  });
});
