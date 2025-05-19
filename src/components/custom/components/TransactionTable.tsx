"use client";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type RouterOutputs } from "@/trpc/shared";
import { TransactionRow, TransactionRowInterface } from "./TransactionRow";

type Category = RouterOutputs["budget"]["getCategories"][number];
type Rule = RouterOutputs["rules"]["getAll"][number];

interface TransactionTableProps {
  transactions: Array<{
    id?: string;
    date: Date;
    name: string;
    amount: number;
    categoryId?: string;
    subcategoryId?: string;
    isDiscarded: boolean;
    appliedRuleId?: string;
  }>;
  setTransactions: (
    transactions: Array<{
      id?: string;
      date: Date;
      name: string;
      amount: number;
      categoryId?: string;
      subcategoryId?: string;
      isDiscarded: boolean;
      appliedRuleId?: string;
    }>,
  ) => void;
  categories: Category[];
  rules?: Rule[];
  onRuleCreated?: () => void;
}

export function TransactionTable({
  transactions,
  setTransactions,
  categories,
  rules = [],
  onRuleCreated,
}: TransactionTableProps) {
  const handleSave = (index: number, transaction: TransactionRowInterface) => {
    const newTransactions = [...transactions];
    if (!newTransactions[index]) return;
    newTransactions[index] = {
      ...newTransactions[index],
      name: transaction.name,
      amount: transaction.amount,
      categoryId: transaction.categoryId,
      subcategoryId: transaction.subcategoryId,
    };
    setTransactions(newTransactions);
  };

  const handleDiscard = (index: number) => {
    const newTransactions = [...transactions];
    if (!newTransactions[index]) return;
    newTransactions[index] = {
      ...newTransactions[index],
      isDiscarded: !newTransactions[index].isDiscarded,
    };
    setTransactions(newTransactions);
  };

  const handleDelete = (index: number) => {
    setTransactions(transactions.filter((_, i) => i !== index));
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Subcategory</TableHead>
            <TableHead className="text-center">Discarded</TableHead>
            <TableHead className="w-[150px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction, index) => (
            <TransactionRow
              key={index}
              transaction={transaction}
              index={index}
              categories={categories}
              rules={rules}
              onSave={handleSave}
              onDiscard={handleDiscard}
              onDelete={handleDelete}
              onRuleCreatedOrChange={onRuleCreated}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
