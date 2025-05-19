"use client";

import { TableCell, TableRow } from "@/components/ui/table";
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
import { X, Plus, Pencil } from "lucide-react";
import { type RouterOutputs } from "@/trpc/shared";
import { RuleDialog } from "../rules/RuleDialog";
import { cn } from "@/lib/utils";
import { InlineEdit } from "@/components/ui/InlineEdit";

type Category = RouterOutputs["budget"]["getCategories"][number];
type Rule = RouterOutputs["rules"]["getAll"][number];

export interface ImportedTransactionRowInterface {
  id?: string;
  date: Date;
  name: string;
  amount: number;
  categoryId?: string;
  subcategoryId?: string;
  isDiscarded: boolean;
  appliedRuleId?: string;
}

interface TransactionRowProps {
  transaction: ImportedTransactionRowInterface;
  index: number;
  categories: Category[];
  rules: Rule[];
  onSave: (index: number, transaction: ImportedTransactionRowInterface) => void;
  onDiscard: (index: number) => void;
  onDelete: (index: number) => void;
  onRuleCreatedOrChange?: () => void;
}

export function ImportedTransactionRow({
  transaction,
  index,
  categories,
  rules,
  onSave,
  onDiscard,
  onDelete,
  onRuleCreatedOrChange,
}: TransactionRowProps) {
  const selectedCategory = categories.find(
    (cat) => cat.id === transaction.categoryId,
  );
  const appliedRule = rules.find(
    (rule) => rule.id === transaction.appliedRuleId,
  );

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

  return (
    <TableRow
      className={cn(
        transaction.isDiscarded && "opacity-50",
        appliedRule && "border-l-4 border-l-green-500",
        !appliedRule &&
          (transaction.isDiscarded ||
            (transaction.categoryId && transaction.subcategoryId)) &&
          "border-l-4 border-l-blue-500",
        !appliedRule &&
          !transaction.isDiscarded &&
          (!transaction.categoryId || !transaction.subcategoryId) &&
          "border-l-4 border-l-red-500",
      )}
    >
      <TableCell>{format(transaction.date, "MMM d, yyyy")}</TableCell>
      <TableCell>
        <InlineEdit
          value={transaction.name}
          onSave={(value) => {
            onSave(index, {
              ...transaction,
              name: value.toString(),
            });
            onRuleCreatedOrChange?.();
          }}
        />
      </TableCell>
      <TableCell className="text-right">
        <InlineEdit
          renderedValue={formatAmount(transaction.amount)}
          value={transaction.amount.toString()}
          onSave={(value) => {
            onSave(index, {
              ...transaction,
              amount: parseFloat(value.toString()),
            });
            onRuleCreatedOrChange?.();
          }}
        />
      </TableCell>
      <TableCell>
        {!appliedRule ? (
          <Select
            value={transaction.categoryId}
            onValueChange={(value) =>
              onSave(index, {
                ...transaction,
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
        {!appliedRule ? (
          <Select
            value={transaction.subcategoryId}
            onValueChange={(value) =>
              onSave(index, {
                ...transaction,
                subcategoryId: value,
              })
            }
            disabled={!transaction.categoryId}
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
          onCheckedChange={() => onDiscard(index)}
        />
      </TableCell>
      <TableCell>
        <div className="flex justify-end space-x-2">
          {appliedRule ? (
            <RuleDialog
              trigger={
                <Button size="sm" variant="outline">
                  <Pencil className="h-4 w-4" />
                </Button>
              }
              editingRule={appliedRule}
              onSuccess={onRuleCreatedOrChange}
            />
          ) : (
            <RuleDialog
              trigger={
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              }
              initialMatchString={transaction.name}
              initialCategoryId={transaction.categoryId}
              initialSubcategoryId={transaction.subcategoryId}
              onSuccess={onRuleCreatedOrChange}
            />
          )}
          <Button size="sm" variant="ghost" onClick={() => onDelete(index)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
