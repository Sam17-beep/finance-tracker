"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type RouterOutputs } from "@/trpc/shared";
import { TransactionRow } from "./TransactionRow";

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
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{
    name: string;
    amount: string;
    categoryId?: string;
    subcategoryId?: string;
  }>({
    name: "",
    amount: "",
  });

  const handleEdit = (index: number) => {
    const transaction = transactions[index];
    if (!transaction) return;
    setEditValues({
      name: transaction.name,
      amount: transaction.amount.toString(),
      categoryId: transaction.categoryId,
      subcategoryId: transaction.subcategoryId,
    });
    setEditingRow(index);
  };

  const handleSave = (index: number) => {
    const newTransactions = [...transactions];
    if (!newTransactions[index]) return;
    newTransactions[index] = {
      ...newTransactions[index],
      name: editValues.name,
      amount: parseFloat(editValues.amount) || 0,
      categoryId: editValues.categoryId,
      subcategoryId: editValues.subcategoryId,
    };
    setTransactions(newTransactions);
    setEditingRow(null);
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
              isEditing={editingRow === index}
              editValues={editValues}
              onEdit={handleEdit}
              onSave={handleSave}
              onDiscard={handleDiscard}
              onDelete={handleDelete}
              onEditValuesChange={setEditValues}
              onRuleCreatedOrChange={onRuleCreated}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
