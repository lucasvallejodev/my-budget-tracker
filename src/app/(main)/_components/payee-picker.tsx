'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react';
import { PayeeResponseType } from '../_types/payees';
import CreatePayeeDialog from './create-payee-dialog';

type PayeePickerProps = {
  onChange?: (category: string) => void;
};

function PayeePicker({ onChange }: PayeePickerProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string>('');

  const payeesQuery = useQuery({
    queryKey: ['payees'],
    queryFn: () => fetch(`/api/payees`).then(res => res.json()),
  });

  const selectedPayee = payeesQuery.data?.find((payee: PayeeResponseType) => payee.id === value);

  const payeeSuccessCallback = (payee: PayeeResponseType) => {
    setValue(payee.id);
    setOpen(false);
  };

  useEffect(() => {
    onChange?.(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" aria-expanded={open} className="w-full justify-between">
          {selectedPayee ? <PayeeRow payee={selectedPayee} /> : 'Select a payee'}
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full sm:max-w-[300px] md:w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Search accounts..." />
          <CreatePayeeDialog onSuccessCallback={payeeSuccessCallback} />
          <CommandList>
            <CommandEmpty>No accounts found.</CommandEmpty>
            <CommandGroup>
              <CommandList>
                {payeesQuery.data?.map((payee: any) => (
                  <CommandItem
                    key={payee.id}
                    onSelect={() => {
                      setOpen(false);
                      setValue(payee.id);
                    }}
                  >
                    <PayeeRow payee={payee} />
                    {selectedPayee?.id === payee.id && <CheckIcon className="ml-1" />}
                  </CommandItem>
                ))}
              </CommandList>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function PayeeRow({ payee }: { payee: any }) {
  return <div className="flex items-center gap-2">{payee.name}</div>;
}

export default PayeePicker;
