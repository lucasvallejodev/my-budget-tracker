import { AuthScreen } from '@/components/shell';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AuthScreen>{children}</AuthScreen>;
}
