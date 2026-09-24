import { AuthForm } from '@/components/shell';

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;

  return <AuthForm mode="sign-in" next={next} />;
}
