'use client';
import { MAIN_ROUTE_ITEMS } from '@/constants/routes';
import { usePathname } from 'next/navigation';

function Header() {
  const path = usePathname();
  const title = MAIN_ROUTE_ITEMS.find(item => item.path === path)?.name || '';

  return (
    <div className="p-5 border-b">
      <div className="md:py-4">
        <h1 className="text-xl">{title}</h1>
      </div>
    </div>
  );
}

export default Header;
