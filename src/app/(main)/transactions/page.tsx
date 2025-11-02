import TransactionsPage from '../_components/transaction-page';

async function Transactions() {
  return (
    <div className="h-full p-5 flex gap-5 flex-col">
      <TransactionsPage />
    </div>
  );
}

export default Transactions;
