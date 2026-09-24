import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { QueryContent } from './query-content';

afterEach(cleanup);

const content = () => <p>Loaded</p>;

describe('QueryContent', () => {
  it('shows the loading message while pending', () => {
    render(
      <QueryContent pending loading="Loading rules…">
        {content}
      </QueryContent>
    );

    expect(screen.getByRole('status').textContent).toBe('Loading rules…');
  });

  it('offers a retry on error', () => {
    const onRetry = vi.fn();

    render(
      <QueryContent pending={false} error loading="" onRetry={onRetry}>
        {content}
      </QueryContent>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('prefers the empty state over the content', () => {
    render(
      <QueryContent pending={false} loading="" empty={<p>Nothing here</p>}>
        {content}
      </QueryContent>
    );

    expect(screen.getByText('Nothing here')).toBeTruthy();
    expect(screen.queryByText('Loaded')).toBeNull();
  });

  it('renders the content once loaded', () => {
    render(
      <QueryContent pending={false} loading="">
        {content}
      </QueryContent>
    );

    expect(screen.getByText('Loaded')).toBeTruthy();
  });
});
