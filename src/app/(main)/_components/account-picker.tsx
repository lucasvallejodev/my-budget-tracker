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
import CreateAccountModal from '@/app/(main)/_components/create-account-dialog';
import { AccountResponseType } from '../_types/accounts';

type AccountPickerProps = {
  onChange?: (category: string) => void;
};

function AccountPicker({ onChange }: AccountPickerProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string>('');

  const categoriesQuery = useQuery({
    queryKey: ['accounts'],
    queryFn: () => fetch(`/api/accounts`).then(res => res.json()),
  });

  console.log(categoriesQuery.data, 'accounts');

  const selectedAccount = categoriesQuery.data?.find(
    (account: AccountResponseType) => account.name === value
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
        <Button variant="outline" aria-expanded={open} className="w-full justify-between">
          {selectedAccount ? <AccountRow category={selectedAccount} /> : 'Select an account'}
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full sm:max-w-[300px] md:w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Search accounts..." />
          <CreateAccountModal onSuccessCallback={accountSuccessCallback} />
          <CommandList>
            <CommandEmpty>No accounts found.</CommandEmpty>
            <CommandGroup>
              <CommandList>
                {categoriesQuery.data?.map((category: any) => (
                  <CommandItem
                    key={category.name}
                    onSelect={() => {
                      setOpen(false);
                      setValue(category.name);
                    }}
                  >
                    <AccountRow category={category} />
                    {selectedAccount?.name === category.name && <CheckIcon className="ml-1" />}
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

function AccountRow({ category }: { category: any }) {
  return (
    <div className="flex items-center gap-2">
      <Icon icon={category.icon} size={80} />
      <span>
        {category.name}{' '}
        <span className="text-sm text-muted-foreground">({category.institution || ''})</span>
      </span>
    </div>
  );
}

export default AccountPicker;
