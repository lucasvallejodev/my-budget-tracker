import { TransactionsPage } from '@/components/finance';

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q: query = '' } = await searchParams;

  return <TransactionsPage key={query} initialSearch={query} />;
}
