import { ApplicationShell } from '@/components/shell/application-shell';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ApplicationShell>{children}</ApplicationShell>;
}
