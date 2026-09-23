import './create-new-button.scss';

import { PlusSquare } from 'lucide-react';

import { cn } from '@/lib/styles';

import { Button, ButtonProps } from '../button';

const CreateIconSize = 16;

export function CreateNewButton({ className, ...props }: Omit<ButtonProps, 'children'>) {
  return (
    <Button variant="ghost" className={cn('create-new-button', className)} {...props}>
      <PlusSquare size={CreateIconSize} />
      Create new
    </Button>
  );
}
