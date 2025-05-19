"use client";

import { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
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
import { X, Plus, Pencil } from "lucide-react";
import { type RouterOutputs } from "@/trpc/shared";
import { RuleDialog } from "./RuleDialog";
import { cn } from "@/lib/utils";

type Category = RouterOutputs["budget"]["getCategories"][number];
type Rule = RouterOutputs["rules"]["getAll"][number];

interface Transaction {
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
  transaction: Transaction;
  index: number;
  categories: Category[];
  rules: Rule[];
  isEditing: boolean;
  editValues: {
    name: string;
    amount: string;
    categoryId?: string;
    subcategoryId?: string;
  };
  onEdit: (index: number) => void;
  onSave: (index: number) => void;
  onDiscard: (index: number) => void;
  onDelete: (index: number) => void;
  onEditValuesChange: (values: {
    name: string;
    amount: string;
    categoryId?: string;
    subcategoryId?: string;
  }) => void;
  onRuleCreatedOrChange?: () => void;
}

export function TransactionRow({
  transaction,
  index,
  categories,
  rules,
  isEditing,
  editValues,
  onEdit,
  onSave,
  onDiscard,
  onDelete,
  onEditValuesChange,
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
        {isEditing ? (
          <Input
            value={editValues.name}
            onChange={(e) =>
              onEditValuesChange({ ...editValues, name: e.target.value })
            }
          />
        ) : (
          transaction.name
        )}
      </TableCell>
      <TableCell className="text-right">
        {isEditing ? (
          <Input
            type="number"
            step="0.01"
            value={editValues.amount}
            onChange={(e) =>
              onEditValuesChange({ ...editValues, amount: e.target.value })
            }
            className="text-right"
          />
        ) : (
          formatAmount(transaction.amount)
        )}
      </TableCell>
      <TableCell>
        {isEditing ? (
          <Select
            value={editValues.categoryId}
            onValueChange={(value) =>
              onEditValuesChange({
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
        {isEditing ? (
          <Select
            value={editValues.subcategoryId}
            onValueChange={(value) =>
              onEditValuesChange({ ...editValues, subcategoryId: value })
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
          onCheckedChange={() => onDiscard(index)}
        />
      </TableCell>
      <TableCell>
        <div className="flex justify-end space-x-2">
          {isEditing ? (
            <Button size="sm" onClick={() => onSave(index)}>
              Save
            </Button>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => onEdit(index)}>
                Edit
              </Button>
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
                  onSuccess={onRuleCreatedOrChange}
                />
              )}
            </>
          )}
          <Button size="sm" variant="ghost" onClick={() => onDelete(index)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
