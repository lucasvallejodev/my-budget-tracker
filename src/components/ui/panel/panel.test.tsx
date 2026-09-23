import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Panel } from './panel';

afterEach(cleanup);

describe('Panel', () => {
  it('renders a titled section with its action', () => {
    render(
      <Panel title="Rules" description="Applied on import" action={<button>Apply</button>}>
        Content
      </Panel>
    );

    expect(screen.getByRole('heading', { level: 2, name: 'Rules' })).toBeTruthy();
    expect(screen.getByText('Applied on import')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Apply' })).toBeTruthy();
  });

  it('omits the head without a title', () => {
    render(<Panel>Only content</Panel>);

    expect(screen.queryByRole('heading')).toBeNull();
  });
});
