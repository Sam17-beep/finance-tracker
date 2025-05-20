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
import { type RouterOutputs } from "@/trpc/shared";
import { format } from "date-fns";
import { InlineEdit } from "@/components/ui/InlineEdit";
import { Pencil, Plus, X } from "lucide-react";
import { RuleDialog } from "../rules/RuleDialog";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type Transaction = RouterOutputs["transaction"]["getAll"]["transactions"][0];
type Category = RouterOutputs["budget"]["getCategories"][number];

interface TransactionTableRowProps {
  transaction: Transaction;
  categories: Category[];
  propsOnChange: (transaction: Transaction) => void;
  propsOnDelete: () => void;
}

export function TransactionTableRow({
  transaction,
  propsOnChange,
  categories,
  propsOnDelete,
}: TransactionTableRowProps) {
  const utils = api.useUtils();

  const onDelete = api.transaction.delete.useMutation({
    onSuccess: () => {
      propsOnDelete();
    },
    onError: () => {
      toast.error("Failed to delete transaction");
    },
  });

  const onChangeMutation = api.transaction.update.useMutation({
    onSuccess: (newTransaction) => {
      propsOnChange(newTransaction);
    },
    onError: () => {
      toast.error("Failed to update transaction");
    },
  });

  const onChange = (transaction: Transaction) => {
    onChangeMutation.mutate({
      id: transaction.id,
      data: {
        ...transaction,
      },
    });
  };

  return (
    <TableRow
      className={cn(
        transaction.isDiscarded && "opacity-50",
        transaction.appliedRules.length > 0 &&
          "border-l-4 border-l-green-500/10",
        transaction.appliedRules.length === 0 &&
          "border-l-4 border-l-blue-500/10",
      )}
    >
      <TableCell>{format(transaction.date, "MMM d, yyyy")}</TableCell>
      <TableCell>
        {" "}
        <InlineEdit
          value={transaction.name}
          onSave={(value) => {
            void onChange({
              ...transaction,
              name: value.toString(),
            });
          }}
        />
      </TableCell>
      <TableCell className="text-right">
        <InlineEdit
          renderedValue={transaction.amount.toString()}
          value={transaction.amount}
          type="number"
          onSave={(value) => {
            console.log(value);
            void onChange({
              ...transaction,
              amount: value as number,
            });
          }}
        />
      </TableCell>
      <TableCell>
        {transaction.appliedRules.length === 0 ? (
          <Select
            value={transaction.categoryId ?? undefined}
            onValueChange={(value) =>
              void onChange({
                ...transaction,
                categoryId: value,
                subcategoryId: null,
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
          (transaction.category?.name ?? "-")
        )}
      </TableCell>
      <TableCell>
        {transaction.appliedRules.length === 0 ? (
          <Select
            value={transaction.subcategoryId ?? undefined}
            onValueChange={(value) =>
              void onChange({
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
              {categories
                .find((category) => category.id === transaction.categoryId)
                ?.subcategories.map((sub) => (
                  <SelectItem key={sub.id} value={sub.id}>
                    {sub.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        ) : (
          (transaction.subcategory?.name ?? "-")
        )}
      </TableCell>
      <TableCell>
        <Switch
          checked={transaction.isDiscarded}
          onCheckedChange={() =>
            void onChange({
              ...transaction,
              isDiscarded: !transaction.isDiscarded,
            })
          }
        />
      </TableCell>
      <TableCell>
        <div className="flex justify-end space-x-2">
          {transaction.appliedRules.length > 0 ? (
            <RuleDialog
              trigger={
                <Button size="sm" variant="outline">
                  <Pencil className="h-4 w-4" />
                </Button>
              }
              editingRule={transaction.appliedRules[0]}
              onSuccess={() => {
                void utils.transaction.getAll.invalidate();
              }}
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
              onSuccess={() => {
                void utils.transaction.getAll.invalidate();
              }}
            />
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete.mutate(transaction.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
