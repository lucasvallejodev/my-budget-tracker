import { HandCoins } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

function Logo() {
  return (
    <Link href="/" className="flex flex-row gap-1 items-center h-14" aria-label="Home">
      <HandCoins className="text-blue-800" />
      <span className="text-primary font-bold text-xl">CoinKeeper</span>
    </Link>
  );
}

export default Logo;
