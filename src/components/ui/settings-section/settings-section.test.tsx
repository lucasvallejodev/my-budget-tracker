import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { SettingsSection } from './settings-section';

afterEach(cleanup);

describe('SettingsSection', () => {
  it('renders the heading beside its controls', () => {
    render(
      <SettingsSection title="Profile Photo" description="Basic profile information">
        <button>Manage</button>
      </SettingsSection>
    );

    expect(screen.getByRole('heading', { name: 'Profile Photo' })).toBeTruthy();
    expect(screen.getByText('Basic profile information')).toBeTruthy();
  });
});
