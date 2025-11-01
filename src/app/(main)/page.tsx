import { Button } from '@/components/ui/button';
import CreateTransactionModal from './_components/create-transaction-dialog';
import { BanknoteArrowUp, ReceiptText } from 'lucide-react';

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
            type="INCOME"
          />
          <CreateTransactionModal
            trigger={
              <Button className="border border-gray-200 bg-white" variant="ghost">
                <ReceiptText />
                New Expense
              </Button>
            }
            type="EXPENSE"
          />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
