"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { X } from "lucide-react";
import { type RouterOutputs } from "@/trpc/shared";

type Category = RouterOutputs["budget"]["getCategories"][number];

interface TransactionTableProps {
  transactions: Array<{
    date: Date;
    name: string;
    amount: number;
    categoryId?: string;
    subcategoryId?: string;
    isDiscarded: boolean;
  }>;
  setTransactions: (
    transactions: Array<{
      date: Date;
      name: string;
      amount: number;
      categoryId?: string;
      subcategoryId?: string;
      isDiscarded: boolean;
    }>,
  ) => void;
  categories: Category[];
}

export function TransactionTable({
  transactions,
  setTransactions,
  categories,
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

  const getSelectedCategory = (categoryId?: string) => {
    return categories.find((cat) => cat.id === categoryId);
  };

  const formatAmount = (amount: number) => {
    const formatted = amount.toFixed(2);
    const isPositive = amount > 0;
    return (
      <span className={isPositive ? "text-green-600" : "text-red-600"}>
        {isPositive ? "+" : ""}
        {formatted}
      </span>
    );
  };

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
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction, index) => {
            const selectedCategory = getSelectedCategory(
              transaction.categoryId,
            );
            return (
              <TableRow
                key={index}
                className={transaction.isDiscarded ? "opacity-50" : ""}
              >
                <TableCell>{format(transaction.date, "MMM d, yyyy")}</TableCell>
                <TableCell>
                  {editingRow === index ? (
                    <Input
                      value={editValues.name}
                      onChange={(e) =>
                        setEditValues({ ...editValues, name: e.target.value })
                      }
                    />
                  ) : (
                    transaction.name
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {editingRow === index ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={editValues.amount}
                      onChange={(e) =>
                        setEditValues({ ...editValues, amount: e.target.value })
                      }
                      className="text-right"
                    />
                  ) : (
                    formatAmount(transaction.amount)
                  )}
                </TableCell>
                <TableCell>
                  {editingRow === index ? (
                    <Select
                      value={editValues.categoryId}
                      onValueChange={(value) =>
                        setEditValues({
                          ...editValues,
                          categoryId: value,
                          subcategoryId: undefined,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    (selectedCategory?.name ?? "-")
                  )}
                </TableCell>
                <TableCell>
                  {editingRow === index ? (
                    <Select
                      value={editValues.subcategoryId}
                      onValueChange={(value) =>
                        setEditValues({ ...editValues, subcategoryId: value })
                      }
                      disabled={!editValues.categoryId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subcategory" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedCategory?.subcategories.map((sub) => (
                          <SelectItem key={sub.id} value={sub.id}>
                            {sub.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    (selectedCategory?.subcategories.find(
                      (sub) => sub.id === transaction.subcategoryId,
                    )?.name ?? "-")
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Switch
                    checked={transaction.isDiscarded}
                    onCheckedChange={() => handleDiscard(index)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex justify-end space-x-2">
                    {editingRow === index ? (
                      <Button size="sm" onClick={() => handleSave(index)}>
                        Save
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(index)}
                      >
                        Edit
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
