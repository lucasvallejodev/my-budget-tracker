import { ChartPie } from 'lucide-react';
import Link from 'next/link';

import styles from './shell/shell.module.scss';

export default function Logo() {
  return (
    <Link href="/" className={styles.logo} aria-label="CoinKeeper home">
      <ChartPie />
      CoinKeeper
    </Link>
  );
}
