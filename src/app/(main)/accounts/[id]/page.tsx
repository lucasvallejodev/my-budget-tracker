import { prisma } from '@/prisma';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getUserOrRedirect } from '@/lib/auth';
import { PageHeading, BalanceCard, Panel } from '@/components/finance/blocks';
import s from '@/components/finance/finance.module.scss';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const user = await getUserOrRedirect();
  const parsed = z
    .string()
    .uuid()
    .safeParse((await params).id);
  if (!parsed.success) redirect('/accounts');
  const account = await prisma.account.findFirst({
    where: { id: parsed.data, userId: user.id, isDeleted: false },
  });
  if (!account) redirect('/accounts');
  return (
    <div className={s.page}>
      <PageHeading title={account.name} description={account.institution || account.type} />
      <div className={s.grid}>
        <BalanceCard amount={Number(account.balance)} />
        <Panel title="Account details">
          <p className={s.muted}>Account ending in {account.accountNumber?.slice(-4) || '—'}</p>
          <p>{account.notes || 'No notes added.'}</p>
        </Panel>
      </div>
    </div>
  );
}
