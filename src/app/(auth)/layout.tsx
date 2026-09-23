import Logo from '@/components/logo';
import styles from '@/components/shell/shell.module.scss';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <main className={styles.auth}>
      <Logo />
      {children}
    </main>
  );
}
