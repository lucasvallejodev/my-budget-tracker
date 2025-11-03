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
import { Icon } from '@/components/icon';
import CreateAccountDialog from '@/app/(main)/_components/create-account-dialog';
import { AccountResponseType } from '../_types/accounts';

type AccountPickerProps = {
  invalid?: boolean;
  onChange?: (category: string) => void;
};

function AccountPicker({ onChange, invalid }: AccountPickerProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string>('');

  const accountsQuery = useQuery({
    queryKey: ['accounts'],
    queryFn: () => fetch(`/api/accounts`).then(res => res.json()),
  });

  const selectedAccount = accountsQuery.data?.find(
    (account: AccountResponseType) => account.id === value
  );

  const accountSuccessCallback = (account: AccountResponseType) => {
    setValue(account.name);
    setOpen(false);
  };

  useEffect(() => {
    onChange?.(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          aria-expanded={open}
          aria-invalid={invalid}
          className="w-full justify-between"
        >
          {selectedAccount ? <AccountRow account={selectedAccount} /> : 'Select an account'}
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full sm:max-w-[300px] md:w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Search accounts..." />
          <CreateAccountDialog onSuccessCallback={accountSuccessCallback} />
          <CommandList>
            <CommandEmpty>No accounts found.</CommandEmpty>
            <CommandGroup>
              <CommandList>
                {accountsQuery.data?.map((account: any) => (
                  <CommandItem
                    key={account.id}
                    onSelect={() => {
                      setOpen(false);
                      setValue(account.id);
                    }}
                  >
                    <AccountRow account={account} />
                    {selectedAccount?.id === account.id && <CheckIcon className="ml-1" />}
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

function AccountRow({ account }: { account: any }) {
  return (
    <div className="flex items-center gap-2">
      <Icon icon={account.icon} size={80} />
      <span>
        {account.name}{' '}
        <span className="text-sm text-muted-foreground">({account.institution || ''})</span>
      </span>
    </div>
  );
}

export default AccountPicker;
