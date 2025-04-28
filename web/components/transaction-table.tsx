import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils";

const weeklyTransactions = [
  {
    category: "Salary",
    amount: "$2,900.00",
    date: "Apr 21, 2025",
    description: "Weekly salary credited to bank account",
    type: "income",
  },
  {
    category: "Groceries",
    amount: "$95.50",
    date: "Apr 22, 2025",
    description: "Walmart grocery shopping, paid via Debit Card",
    type: "expense",
  },
  {
    category: "Transportation",
    amount: "$30.00",
    date: "Apr 23, 2025",
    description: "Gas refill for car, paid via Credit Card",
    type: "expense",
  },
  {
    category: "Subscription",
    amount: "$9.99",
    date: "Apr 24, 2025",
    description: "Netflix monthly subscription, auto-paid",
    type: "expense",
  },
  {
    category: "Freelance",
    amount: "$300.00",
    date: "Apr 24, 2025",
    description: "Logo design project, paid via PayPal",
    type: "income",
  },
  {
    category: "Dining",
    amount: "$45.00",
    date: "Apr 25, 2025",
    description: "Dinner at local restaurant, paid via Credit Card",
    type: "expense",
  },
  {
    category: "Utilities",
    amount: "$120.00",
    date: "Apr 26, 2025",
    description: "Electricity bill payment, paid via Bank Transfer",
    type: "expense",
  },
];

export function TransactionTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="font-bold text-center">Category</TableHead>
          <TableHead className="font-bold text-center">Amount</TableHead>
          <TableHead className="font-bold text-center">Date</TableHead>
          <TableHead className="font-bold text-center">Description</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="text-gray-500">
        {weeklyTransactions.map((transaction) => (
          <TableRow key={transaction.date}>
            <TableCell className="font-medium">{transaction.category}</TableCell>
            <TableCell className={cn("text-center", transaction.type === "income" && "text-green-600")}>{transaction.type === "income" ? "+" : "-"} {transaction.amount}</TableCell>
            <TableCell className="text-center">{transaction.date}</TableCell>
            <TableCell className="text-center">{transaction.description}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
