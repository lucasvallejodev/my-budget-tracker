'use client';

import { Loader2, PlusSquareIcon } from 'lucide-react';
import { MouseEventHandler } from 'react';

import styles from '@/components/forms.module.scss';

import { Button } from './button';
import { DialogClose, DialogFooter, DialogTrigger } from './dialog';

type DialogFormFooterProps = {
  isPending: boolean;
  onCancel: () => void;
  onSubmit?: MouseEventHandler<HTMLButtonElement>;
  submitLabel: string;
};

export const saveLabel = (editing: boolean, create = 'Create'): string =>
  editing ? 'Save' : create;

export function CreateNewTrigger({ onClick }: { onClick: () => void }) {
  return (
    <DialogTrigger asChild>
      <Button variant="ghost" className={styles.create} onClick={onClick}>
        <PlusSquareIcon className={styles.smallIcon} />
        Create new
      </Button>
    </DialogTrigger>
  );
}

export function DialogFormFooter({
  isPending,
  onCancel,
  onSubmit,
  submitLabel,
}: DialogFormFooterProps) {
  return (
    <DialogFooter>
      <DialogClose asChild>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </DialogClose>
      <Button type="submit" disabled={isPending} onClick={onSubmit}>
        {isPending ? <Loader2 className={styles.spinner} /> : submitLabel}
      </Button>
    </DialogFooter>
  );
}
