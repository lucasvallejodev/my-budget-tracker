'use client';

import * as React from 'react';

import { useMediaQuery } from '@/hooks/use-media-query';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useMutation, useQuery } from '@tanstack/react-query';
import { UserSettings } from '@prisma/client';
import { useCallback, useEffect } from 'react';
import { Currency } from '@/types/currency';
import { CURRENCIES } from '@/constants/currencies';
import { updateUserCurrency } from '@/app/(management)/settings/_actions/userSettings';
import { toast } from 'sonner';

export function CurrencyComboBox() {
  const [open, setOpen] = React.useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [selectedCurrency, setSelectedCurrency] = React.useState<Currency | null>(null);

  const userSettings = useQuery<UserSettings>({
    queryKey: ['userSettings'],
    queryFn: async () => {
      const response = await fetch('/api/user-settings');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return await response.json();
    },
  });

  useEffect(() => {
    if (userSettings.data) {
      const userCurrency = CURRENCIES.find(
        currency => currency.value === userSettings.data.currency
      );
      setSelectedCurrency(userCurrency || null);
    }
  }, [userSettings.data]);

  const mutation = useMutation({
    mutationFn: updateUserCurrency,
    onSuccess: (data: UserSettings) => {
      toast.success('Currency updated successfully', {
        id: 'currency-update',
      });
      setSelectedCurrency(CURRENCIES.find(currency => currency.value === data.currency) || null);
    },
    onError: error => {
      toast.error('Error updating currency', {
        id: 'currency-update',
      });
      console.error('Error updating currency:', error);
    },
  });

  const selectOption = useCallback(
    (currency: Currency | null) => {
      if (!currency) {
        toast.error('Please select a currency');
        return;
      }

      toast.loading('Updating currency...', {
        id: 'currency-update',
      });

      mutation.mutate(currency);
    },
    [mutation]
  );

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start" disabled={mutation.isPending}>
            {selectedCurrency ? <>{selectedCurrency.label}</> : <>+ Set currency</>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <StatusList setOpen={setOpen} setSelectedCurrency={selectOption} />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" className="w-full justify-start" disabled={mutation.isPending}>
          {selectedCurrency ? <>{selectedCurrency.label}</> : <>+ Set currency</>}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mt-4 border-t">
          <StatusList setOpen={setOpen} setSelectedCurrency={selectOption} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function StatusList({
  setOpen,
  setSelectedCurrency,
}: {
  setOpen: (open: boolean) => void;
  setSelectedCurrency: (currency: Currency | null) => void;
}) {
  return (
    <Command>
      <CommandInput placeholder="Filter currency..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup>
          {CURRENCIES.map(currency => (
            <CommandItem
              key={currency.value}
              value={currency.value}
              onSelect={value => {
                setSelectedCurrency(CURRENCIES.find(priority => priority.value === value) || null);
                setOpen(false);
              }}
            >
              {currency.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
