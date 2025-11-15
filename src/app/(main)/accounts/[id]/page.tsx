import { prisma } from '@/prisma';
import { redirect } from 'next/navigation';
import { z } from 'zod';

type AccountsProps = {
  params: Promise<{ id: string }>;
};

const accountPropsSchema = z.object({
  id: z.string().uuid(),
});

export default async function Accounts({ params }: AccountsProps) {
  const parsedParams = accountPropsSchema.safeParse(await params);

  if (!parsedParams.success) {
    redirect('/accounts');
  }

  const account = await prisma.account.findUnique({
    where: {
      id: parsedParams.data.id,
    },
  });

  if (!account) {
    redirect('/accounts');
  }

  return (
    <div className="h-full p-5 flex gap-5 flex-col">
      <div className="flex flex-col items-center gap-1 max-w-full">
        <div className="w-full text-sm text-neutral-800 text-center leading-5">
          Your monthly payment for subcriptions
        </div>
        <h2 className="text-5xl font-bold text-neutral-1000 leading-[58px]">$ {account.balance}</h2>
      </div>

      {/* <div className="flex flex-col gap-5 max-w-[600px]">
        <div className="flex flex-col p-3 px-5 pb-3.5 gap-2 rounded-[18px] border border-neutral-400 bg-neutral-0 shadow-[0_25px_40px_-10px_rgba(34,24,63,0.06)]">
          {subscriptions.map((sub, index) => (
            <div key={sub.id}>
              <div className="flex justify-between items-center w-full py-1">
                <div className="flex items-center gap-2">
                  <div className="flex w-9 h-9 justify-center items-center rounded-[30px] border border-neutral-300">
                    {sub.logo}
                  </div>
                  <div className="flex flex-col p-2.5">
                    <div className="text-sm text-neutral-800 leading-5">
                      {sub.name}
                    </div>
                    <div className="text-base font-bold text-neutral-1000 leading-7">
                      ${sub.price}/mo
                    </div>
                  </div>
                </div>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7.49988 3.33331L14.1665 9.99998L7.49988 16.6666" stroke="#9999A3" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              {index < subscriptions.length - 1 && (
                <div className="h-px bg-transparent my-1" />
              )}
            </div>
          ))}
        </div>
      </div> */}
    </div>
  );
}
