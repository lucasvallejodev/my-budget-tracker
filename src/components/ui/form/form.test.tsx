import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { afterEach, describe, expect, it } from 'vitest';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormStack,
} from './form';

afterEach(cleanup);

function NameForm() {
  const form = useForm({ defaultValues: { name: '' } });

  return (
    <Form {...form}>
      <FormStack onSubmit={form.handleSubmit(() => undefined)}>
        <FormField
          control={form.control}
          name="name"
          rules={{ required: 'Name is required' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <input {...field} />
              </FormControl>
              <FormDescription>Shown on reports</FormDescription>
            </FormItem>
          )}
        />
        <button type="submit">Save</button>
      </FormStack>
    </Form>
  );
}

describe('Form', () => {
  it('links the label and description, and announces errors', async () => {
    render(<NameForm />);

    const input = screen.getByLabelText('Name');

    expect(input.getAttribute('aria-describedby')).toContain('description');
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('Name is required'));
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });
});
