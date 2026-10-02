'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { createTemplate } from '@/api/mutations';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFormFooter,
  DialogTitle,
  Form,
  FormStack,
  TextField,
} from '@/components/ui';
import { templateFormSchema } from '@coinkeeper/shared/schema/templates';

import { useEntityMutation } from '../use-entity-mutation';
import type { TemplateDraft } from './template-draft';

const nameSchema = templateFormSchema.pick({ name: true });

type NameValues = { name: string };

export function SaveTemplateDialog({
  draft,
  onOpenChange,
  open,
  suggestedName,
}: {
  draft: TemplateDraft;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  suggestedName: string;
}) {
  const form = useForm<NameValues>({
    defaultValues: { name: suggestedName },
    resolver: zodResolver(nameSchema),
  });

  const { isPending, mutate } = useEntityMutation({
    errorMessage: 'Could not save the template',
    mutationFn: ({ name }: NameValues) => createTemplate({ ...draft, name }),
    onSuccess: () => onOpenChange(false),
    successMessage: 'Template saved',
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Save as template</DialogTitle>
        <DialogDescription>
          Everything but the date is kept. Pick the template next time to fill the form in one tap.
        </DialogDescription>
        <Form {...form}>
          <FormStack
            onSubmit={event => {
              event.stopPropagation();
              void form.handleSubmit(values => mutate(values))(event);
            }}
          >
            <TextField
              control={form.control}
              name="name"
              label="Template name"
              description="Shown on the template chip, for example Coffee or Rent."
            />
            <DialogFormFooter
              isPending={isPending}
              submitLabel="Save template"
              onCancel={() => onOpenChange(false)}
            />
          </FormStack>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
