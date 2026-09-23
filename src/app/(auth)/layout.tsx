import Logo from '@/components/logo';
import s from '@/components/shell/shell.module.scss';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <main className={s.auth}>
      <Logo />
      {children}
    </main>
  );
}
