'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import UserProfile from './user-profile';
import Logo from '@/components/logo';
import { MAIN_ROUTE_ITEMS } from '@/app/(main)/routes';
import { RouteItem } from '@/types/route-item';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import { AccountResponseType } from '../_types/accounts';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@/components/icon';

type SideNavbarLinksProps = {
  title: string;
  links: RouteItem[];
};

function SideNavbarLinks({ title, links }: SideNavbarLinksProps) {
  const path = usePathname();
  return (
    <>
      <h2 className="text-primary font-bold text-sm">{title}</h2>
      <ul>
        {links.map((menu, index) => (
          <li key={index}>
            <Link
              href={menu.path}
              className={`flex gap-2 items-center text-gray-500 font-medium text-sm p-2 my-2 cursor-pointer rounded-sm hover:text-primary hover:bg-gray-100 ${path == menu.path && 'text-primary bg-white border border-gray-100'}`}
              aria-label={menu.name}
            >
              <menu.icon className="h-5" />
              {menu.name}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

function SideAccountLinks() {
  const path = usePathname();
  const accountsQuery = useQuery({
    queryKey: ['accounts'],
    queryFn: () => fetch(`/api/accounts`).then(res => res.json()),
  });

  return (
    <>
      <h2 className="text-primary font-bold text-sm mt-4">Accounts</h2>
      <ul>
        {accountsQuery.data?.map((account: AccountResponseType) => (
          <li key={account.id}>
            <Link
              href={'/accounts/' + account.id}
              className={`flex gap-2 items-center text-gray-500 font-medium text-sm p-2 my-2 cursor-pointer rounded-sm hover:text-primary hover:bg-gray-100 ${path == '/accounts/' + account.id && 'text-primary bg-white border border-gray-100'}`}
              aria-label={account.name}
            >
              <Icon icon={account.icon} />
              {account.name}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

function NavContent() {
  return (
    <>
      <Logo />
      <div className="mt-6">
        <SideNavbarLinks title="Main Menu" links={MAIN_ROUTE_ITEMS} />
        <SideAccountLinks />
      </div>
    </>
  );
}

function SideNavbar() {
  return (
    <div className="flex flex-col justify-between h-screen p-5 shadow-sm bg-gray-50">
      <nav>
        <NavContent />
      </nav>
      <UserProfile />
    </div>
  );
}

function MobileNavbar() {
  return (
    <div className="block border-separate bg-background md:hidden">
      <nav className="flex items-center justify-between px-4 py-2 shadow-sm w-full">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="ghost">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent className="w-64 p-4 bg-gray-50">
            <NavContent />
          </SheetContent>
        </Sheet>
        <div>
          <UserButton />
        </div>
      </nav>
    </div>
  );
}

export { SideNavbar, MobileNavbar };
