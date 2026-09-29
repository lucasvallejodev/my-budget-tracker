import { TransactionsPage } from '@/components/finance';
import { isIsoMonth } from '@coinkeeper/shared/lib/patterns';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; q?: string }>;
}) {
  const { month, q: query = '' } = await searchParams;
  const initialMonth = month && isIsoMonth(month) ? month : undefined;

  return (
    <TransactionsPage
      key={`${query}|${initialMonth ?? ''}`}
      initialSearch={query}
      initialMonth={initialMonth}
    />
  );
}
