import './logo.scss';

import { ChartPie } from 'lucide-react';
import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/" className="logo" aria-label="CoinKeeper home">
      <span className="logo__mark" aria-hidden>
        <ChartPie />
      </span>
      CoinKeeper
    </Link>
  );
}
