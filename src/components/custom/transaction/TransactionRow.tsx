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
import { Pencil, Plus, X, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { RuleDialog } from "../rules/RuleDialog";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  const getStatusInfo = () => {
    if (transaction.isDiscarded) {
      return {
        icon: <X className="h-4 w-4 text-red-500" />,
        label: "Discarded",
        variant: "destructive" as const,
        className: "text-red-600"
      };
    }
    
    if (transaction.categoryId) {
      return {
        icon: <CheckCircle className="h-4 w-4 text-green-500" />,
        label: "Categorized",
        variant: "default" as const,
        className: "text-green-600"
      };
    }
    
    return {
      icon: <Clock className="h-4 w-4 text-yellow-500" />,
      label: "Pending",
      variant: "secondary" as const,
      className: "text-yellow-600"
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <TableRow
      className={cn(
        transaction.isDiscarded && "opacity-50 bg-muted/30",
        transaction.categoryId && transaction.appliedRules.length > 0 &&
          "border-l-4 border-l-blue-500/60 bg-blue-50/50 dark:bg-blue-950/40",
        transaction.categoryId && transaction.appliedRules.length === 0 &&
          "border-l-4 border-l-green-500/60 bg-green-50/50 dark:bg-green-950/40",
        !transaction.categoryId && !transaction.isDiscarded &&
          "border-l-4 border-l-yellow-500/60 bg-yellow-50/50 dark:bg-yellow-950/40",
        "hover:bg-muted/50 transition-colors"
      )}
    >
      <TableCell className="font-medium">
        <div className="flex flex-col">
          <span>{format(transaction.date, "MMM d")}</span>
          <span className="text-xs text-muted-foreground">
            {format(transaction.date, "yyyy")}
          </span>
        </div>
      </TableCell>
      <TableCell className="max-w-[300px]">
        <div className="flex flex-col">
          <InlineEdit
            value={transaction.name}
            onSave={(value) => {
              void onChange({
                ...transaction,
                name: value.toString(),
              });
            }}
            className="font-medium truncate"
          />
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex flex-col items-end">
          <InlineEdit
            renderedValue={formatCurrency(transaction.amount)}
            value={transaction.amount}
            type="number"
            onSave={(value) => {
              void onChange({
                ...transaction,
                amount: value as number,
              });
            }}
            className={cn(
              "font-semibold",
              transaction.amount < 0 ? "text-red-600" : "text-green-600"
            )}
          />
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          {!transaction.categoryId ? (
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
              <SelectTrigger className="w-full">
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
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {transaction.category?.name ?? "-"}
              </span>
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          {!transaction.categoryId ? (
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
              <SelectTrigger className="w-full">
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
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {transaction.subcategory?.name ?? "-"}
              </span>
            </div>
          )}
        </div>
      </TableCell>
      <TableCell className="text-center">
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1">
            {statusInfo.icon}
          </div>
          <Switch
            checked={transaction.isDiscarded}
            onCheckedChange={() =>
              void onChange({
                ...transaction,
                isDiscarded: !transaction.isDiscarded,
              })
            }
          />
        </div>
      </TableCell>
      <TableCell>
        <div className="flex justify-end space-x-2">
          {transaction.appliedRules.length > 0 ? (
            <RuleDialog
              trigger={
                <Button size="sm" variant="outline" className="h-8 w-8 p-0">
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
                <Button size="sm" variant="outline" className="h-8 w-8 p-0">
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
            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
