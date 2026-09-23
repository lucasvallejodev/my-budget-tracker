import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Field } from './field';

afterEach(cleanup);

describe('Field', () => {
  it('labels the control it wraps', () => {
    render(
      <Field>
        Name
        <input />
      </Field>
    );

    expect(screen.getByLabelText('Name')).toBeTruthy();
  });

  it('renders a group for controls that are not labelable', () => {
    render(<Field as="div">Category</Field>);

    expect(screen.getByText('Category').tagName).toBe('DIV');
  });
});
