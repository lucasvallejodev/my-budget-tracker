import { ChartPie } from 'lucide-react';
import Link from 'next/link';
import s from './shell/shell.module.scss';

export default function Logo() {
  return (
    <Link href="/" className={s.logo} aria-label="CoinKeeper home">
      <ChartPie />
      CoinKeeper
    </Link>
  );
}
