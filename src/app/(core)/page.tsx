import { Button } from '@/components/ui/button';
import CreateTransactionModal from './_components/create-transaction-modal';
import { BanknoteArrowUp, ReceiptText } from 'lucide-react';
import ExpenseCategory from '@/components/expense/expense-category';
import ExpenseItem from '@/components/expense/expense-item';

const subscriptions = [
  {
    id: 1,
    name: "Patreon membership",
    price: "19.99",
    logo: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 36C27.9411 36 36 27.9411 36 18C36 8.05887 27.9411 0 18 0C8.05887 0 0 8.05887 0 18C0 27.9411 8.05887 36 18 36Z" fill="#F76754"/>
        <path d="M9.59998 25.8H12.6V10.2H9.59998V25.8Z" fill="#002C49"/>
        <path d="M20.4094 10.2C23.7126 10.2 26.4 12.8956 26.4 16.209C26.4 19.5125 23.7126 22.2 20.4094 22.2C17.0958 22.2 14.4 19.5125 14.4 16.209C14.4 12.8956 17.0958 10.2 20.4094 10.2Z" fill="white"/>
      </svg>
    ),
  },
  {
    id: 2,
    name: "Netflix",
    price: "12",
    logo: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 18C0 8.05887 8.05887 0 18 0C27.9411 0 36 8.05887 36 18C36 27.9411 27.9411 36 18 36C8.05887 36 0 27.9411 0 18Z" fill="white"/>
        <path d="M15.8643 28.3721V16.461L19.8927 27.8915C21.1306 27.7511 22.3713 27.6215 23.6146 27.4973V7.20001H20.349V19.5363L16.0047 7.20001H12.6V28.8H12.6216C13.7016 28.6515 14.7816 28.5084 15.8643 28.3721" fill="#E50A13"/>
      </svg>
    ),
  },
  {
    id: 3,
    name: "Apple payment",
    price: "19.99",
    logo: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="18" cy="18" r="18" fill="white"/>
        <path d="M13.364 4.93262C14.7951 4.93271 16.3115 5.71732 17.3904 7.07031C13.8531 9.02061 14.4255 14.1016 17.9998 15.4609C17.5083 16.5563 17.2715 17.0464 16.6384 18.0166C15.7553 19.3708 14.5099 21.0569 12.9656 21.0693C11.595 21.084 11.2414 20.1705 9.38062 20.1816C7.51971 20.1916 7.1316 21.0867 5.75854 21.0732C4.21533 21.0596 3.03519 19.5379 2.1521 18.1836C-0.318538 14.3996 -0.578341 9.95771 0.945068 7.59473C2.02893 5.91701 3.7384 4.93555 5.34448 4.93555C6.97885 4.93558 8.00751 5.83691 9.36108 5.83691C10.6739 5.83681 11.4735 4.93262 13.364 4.93262ZM12.95 0C13.1384 1.27983 12.6176 2.53374 11.9304 3.4209C11.1951 4.37251 9.92694 5.10872 8.69897 5.07031C8.47485 3.84489 9.04947 2.58215 9.7478 1.7334C10.5139 0.796727 11.8267 0.0780579 12.95 0Z" fill="#0B0B0A"/>
      </svg>
    ),
  },
  {
    id: 4,
    name: "Spotify",
    price: "6.99",
    logo: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.9999 0C8.05904 0 0 8.05882 0 17.9997C0 27.9416 8.05904 36 17.9999 36C27.9412 36 36 27.9416 36 17.9997C36 8.05882 27.9412 0 17.9999 0" fill="#1ED760"/>
        <path d="M25.8592 25.5709C25.5406 26.0934 24.8604 26.257 24.3399 25.9386C20.1767 23.3942 14.9367 22.8196 8.76554 24.2291C8.17087 24.3655 7.57811 23.9929 7.44262 23.3984C7.30628 22.8037 7.67761 22.211 8.27355 22.0753C15.0269 20.5315 20.8197 21.1959 25.4926 24.0513C26.0136 24.3695 26.1776 25.0501 25.8592 25.5709" fill="white"/>
        <path d="M28.0286 20.7435C27.6276 21.394 26.777 21.5981 26.1273 21.1986C21.3631 18.2702 14.0979 17.4217 8.46135 19.1326C7.73055 19.3534 6.95847 18.9415 6.7364 18.2117C6.51623 17.4809 6.92841 16.7103 7.65815 16.488C14.0971 14.534 22.1018 15.4803 27.5738 18.8432C28.2236 19.2434 28.4281 20.0944 28.0286 20.7435" fill="white"/>
        <path d="M28.2157 15.7168C22.501 12.323 13.0748 12.0109 7.61941 13.6667C6.74317 13.9326 5.81676 13.438 5.5515 12.562C5.28602 11.6853 5.77992 10.7596 6.65658 10.4932C12.9192 8.59237 23.3294 8.95946 29.9083 12.8647C30.6965 13.3326 30.9547 14.3503 30.4877 15.1369C30.0203 15.9249 29.0018 16.1847 28.2157 15.7168" fill="white"/>
      </svg>
    ),
  },
];

async function Dashboard() {
  return (
    <div className="h-full p-5 flex gap-5 flex-col">
      <div className="flex gap-4 flex-col p-5 border rounded-sm bg-gray-50">
        <h2 className="text-xl">Manage your money</h2>
        <div className="flex gap-2 flex-col md:flex-row">
          <CreateTransactionModal
            trigger={
              <Button className="border border-gray-200 bg-white" variant="ghost">
                <BanknoteArrowUp />
                New income
              </Button>
            }
            type="income"
          />
          <CreateTransactionModal
            trigger={
              <Button className="border border-gray-200 bg-white" variant="ghost">
                <ReceiptText />
                New Expense
              </Button>
            }
            type="expense"
          />
        </div>
      </div>
      <div className="flex flex-col p-3.5 px-5 pb-5 gap-4 rounded-[18px] border border-neutral-400 bg-neutral-0 relative max-w-[600px]">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <span className="text-sm text-neutral-800 leading-5">Left to spend</span>
            <span className="text-lg font-bold text-neutral-1000 leading-7">$738</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-sm text-neutral-800 leading-5">Monthly budget</span>
            <span className="text-lg font-bold text-neutral-1000 leading-7">$2,550</span>
          </div>
        </div>

        <div className="w-full h-2 bg-neutral-200 rounded-md relative overflow-hidden">
          <div className="absolute left-0 h-full w-[15.4%] bg-violet-500 rounded-l-md" />
          <div className="absolute left-[15.4%] h-full w-[18.2%] bg-amber-500" />
          <div className="absolute left-[33.6%] h-full w-[38.1%] bg-emerald-500 rounded-r-md" />
        </div>
      </div>

      <div className="flex flex-col p-3.5 px-5 pb-5 gap-4 rounded-[18px] border border-neutral-400 bg-neutral-0 relative max-w-[600px]">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <span className="text-sm text-neutral-800 leading-5">Expenses per month</span>
          </div>
        </div>
        <div className="flex gap-2 h-[300px]">
          <div className="w-[40px] h-full h-2 relative text-sm text-neutral-800">
            <span className="absolute bottom-[0%] w-full">$749</span>
            <span className="absolute bottom-[16%] w-full">$1289</span>
            <span className="absolute bottom-[40%] w-full">$1738</span>
          </div>
          <div className="w-[20px] h-full mr-2 h-2 bg-neutral-200 rounded-md relative overflow-hidden">
            <div className="absolute bottom-0 w-full h-[16%] bg-violet-500 rounded-b-md" />
            <div className="absolute bottom-[16%] w-full h-[24%] bg-amber-500" />
            <div className="absolute bottom-[40%] w-full h-[44%] bg-emerald-500 rounded-t-md" />
          </div>

          <div className="w-[20px] h-full h-2 bg-neutral-200 rounded-md relative overflow-hidden">
            <div className="absolute bottom-0 w-full h-[30%] bg-violet-500 rounded-b-md" />
            <div className="absolute bottom-[15.4%] w-full h-[28%] bg-amber-500" />
            <div className="absolute bottom-[33.6%] w-full h-[18%] bg-emerald-500 rounded-t-md" />
          </div>
        </div>
      </div>

      <ExpenseCategory
        icon={
          <>
            <div className="absolute w-11 h-11 rounded-[14px] bg-purple-dark opacity-10" />
            <svg className="absolute left-[13px] top-[12px]" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18.125 6.66667C18.125 7.00834 17.8417 7.29167 17.5 7.29167H2.5C2.15833 7.29167 1.875 7.00834 1.875 6.66667C1.875 6.325 2.15833 6.04167 2.5 6.04167H3.35L3.66667 4.53334C3.96667 3.075 4.59167 1.73334 7.075 1.73334H12.925C15.4083 1.73334 16.0333 3.075 16.3333 4.53334L16.65 6.04167H17.5C17.8417 6.04167 18.125 6.325 18.125 6.66667Z" fill="#6A43DD"/>
              <path d="M18.4833 11.3833C18.3583 10.0083 17.9917 8.54166 15.3167 8.54166H4.68333C2.00833 8.54166 1.65 10.0083 1.51667 11.3833L1.05 16.4583C0.991667 17.0917 1.2 17.725 1.63333 18.2C2.075 18.6833 2.7 18.9583 3.36667 18.9583H4.93333C6.28333 18.9583 6.54167 18.1833 6.70833 17.675L6.875 17.175C7.06667 16.6 7.11667 16.4583 7.86667 16.4583H12.1333C12.8833 16.4583 12.9083 16.5417 13.125 17.175L13.2917 17.675C13.4583 18.1833 13.7167 18.9583 15.0667 18.9583H16.6333C17.2917 18.9583 17.925 18.6833 18.3667 18.2C18.8 17.725 19.0083 17.0917 18.95 16.4583L18.4833 11.3833ZM7.5 13.125H5C4.65833 13.125 4.375 12.8417 4.375 12.5C4.375 12.1583 4.65833 11.875 5 11.875H7.5C7.84167 11.875 8.125 12.1583 8.125 12.5C8.125 12.8417 7.84167 13.125 7.5 13.125ZM15 13.125H12.5C12.1583 13.125 11.875 12.8417 11.875 12.5C11.875 12.1583 12.1583 11.875 12.5 11.875H15C15.3417 11.875 15.625 12.1583 15.625 12.5C15.625 12.8417 15.3417 13.125 15 13.125Z" fill="#6A43DD"/>
            </svg>
          </>
        }
        name="Auto & transport"
        total={700}
      >
        <ExpenseItem
          name="Auto & transport"
          amount={350}
          budget={536}
          leftAmount={186}
          color="#6A43DD"
        />
        <ExpenseItem
          name="Auto insurance"
          amount={250}
          budget={370}
          leftAmount={120}
          color="#6A43DD"
        />
      </ExpenseCategory>

      <div className="flex flex-col items-center gap-1 max-w-[600px]">
        <div className="w-[159px] text-sm text-neutral-800 text-center leading-5">
          Your monthly payment for subcriptions
        </div>
        <h2 className="text-5xl font-bold text-neutral-1000 leading-[58px]">
          $61.88
        </h2>
      </div>

      <div className="flex flex-col gap-5 max-w-[600px]">
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
      </div>
    </div>
  );
}

export default Dashboard;
