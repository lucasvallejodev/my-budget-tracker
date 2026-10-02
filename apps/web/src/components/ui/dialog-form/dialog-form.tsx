'use client';

import { MouseEventHandler, ReactNode } from 'react';

import { Button } from '../button';
import { CreateNewButton } from '../create-new-button';
import { DialogClose, DialogFooter, DialogTrigger } from '../dialog';
import { Spinner } from '../spinner';

type DialogFormFooterProps = {
  isPending: boolean;
  onCancel: () => void;
  onSubmit?: MouseEventHandler<HTMLButtonElement>;
  secondaryAction?: ReactNode;
  submitLabel: string;
};

export const saveLabel = (editing: boolean, create = 'Create'): string =>
  editing ? 'Save' : create;

export function CreateNewTrigger({ onClick }: { onClick: () => void }) {
  return (
    <DialogTrigger asChild>
      <CreateNewButton onClick={onClick} />
    </DialogTrigger>
  );
}

export function DialogFormFooter({
  isPending,
  onCancel,
  onSubmit,
  secondaryAction,
  submitLabel,
}: DialogFormFooterProps) {
  return (
    <DialogFooter>
      {secondaryAction}
      <DialogClose asChild>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </DialogClose>
      <Button type="submit" disabled={isPending} onClick={onSubmit}>
        {isPending ? <Spinner label="Saving" /> : submitLabel}
      </Button>
    </DialogFooter>
  );
}
