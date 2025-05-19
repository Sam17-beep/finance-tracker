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
import { TransactionRow, type TransactionRowInterface } from "./TransactionRow";
import { Eye, EyeOff, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

type VisibilityMode = "all" | "hide-ruled" | "hide-classified";

export function TransactionTable({
  transactions,
  setTransactions,
  categories,
  rules = [],
  onRuleCreated,
}: TransactionTableProps) {
  const [visibilityMode, setVisibilityMode] = useState<VisibilityMode>("all");

  const filteredTransactions = transactions
    .map((transaction, index) => ({ transaction, index }))
    .filter(({ transaction }) => {
      switch (visibilityMode) {
        case "hide-ruled":
          return !transaction.appliedRuleId;
        case "hide-classified":
          return (
            !transaction.appliedRuleId &&
            !transaction.categoryId &&
            !transaction.subcategoryId
          );
        default:
          return true;
      }
    });

  const ruledCount = transactions.filter((t) => t.appliedRuleId).length;
  const classifiedCount = transactions.filter(
    (t) => t.categoryId && t.subcategoryId,
  ).length;
  const unruledCount = transactions.length - ruledCount;

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Select
            value={visibilityMode}
            onValueChange={(value: VisibilityMode) => setVisibilityMode(value)}
          >
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <SelectValue placeholder="Filter transactions" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Show All
                </div>
              </SelectItem>
              <SelectItem value="hide-ruled">
                <div className="flex items-center gap-2">
                  <EyeOff className="h-4 w-4" />
                  Hide Ruled
                </div>
              </SelectItem>
              <SelectItem value="hide-classified">
                <div className="flex items-center gap-2">
                  <EyeOff className="h-4 w-4" />
                  Hide Classified
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Badge variant="secondary">Total: {transactions.length}</Badge>
            <Badge variant="outline">Ruled: {ruledCount}</Badge>
            <Badge variant="outline">Classified: {classifiedCount}</Badge>
            <Badge variant="outline">Unruled: {unruledCount}</Badge>
          </div>
        </div>
      </div>
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
            {filteredTransactions.map(({ transaction, index }) => (
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
    </div>
  );
}
