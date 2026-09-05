import TransactionsPage from '../_components/transaction-page';
export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams;
  return <TransactionsPage key={q} initialSearch={q} />;
}
