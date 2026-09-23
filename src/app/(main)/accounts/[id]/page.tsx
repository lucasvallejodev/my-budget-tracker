import { AccountDetail } from '@/components/finance/account-detail';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <AccountDetail accountId={id} />;
}
