'use client'
import React, { use } from 'react'
import Logo from './Logo'
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const items = [
  { name: "Dashboard", href: "/" },
  { name: "Transactions", href: "/transactions" },
  { name: "Manage", href: "/manage" }
]

function NavbarItem({ name, href }: { name: string, href: string }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <div className="relative flex items-center">
      <Link href={href} className={`w-full justify-start text-lg text-muted-foreground hover:text-foreground ${isActive ? 'text-foreground' : ''}`}>{name}</Link>
      {
        isActive ? (
          <div className="absolute -bottom-[2px] left-1/2 hidden h-[2px] w-[80%] -translate-x-1/2 rounded-xl bg-foreground md:block"></div>
        ) : null
      }
      
    </div>
  )
}

function DesktopNavbar() {
  return (
    <div className="border-separate border-b bg-background md:block">
      <nav className="container flex items-center justify-between px-8">
        <div className="flex h-[80px] min-h-[60px] items-center gap-x-4">
          <Logo />
          <div className="flex h-full">
            {
              items.map((item) => (
                <NavbarItem
                  key={item.name}
                  href={item.href}
                  name={item.name}
                />
              ))
            }
          </div>
        </div>
      </nav>
    </div>
  )
}

function MobileNavbar() {
  return (
    <div>MobileNavbar</div>
  )
}

function Navbar() {
  return (
    <>
      <DesktopNavbar />
    </>
  )
}

export default Navbar