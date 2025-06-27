"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type Category } from "./types";
import { SubcategoryForm } from "./SubcategoryForm";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { InlineEdit } from "../../ui/InlineEdit";

interface CategoryItemProps {
  category: Category;
  onDelete: () => void;
  dragHandle?: React.ReactNode;
  lastMonthSpending?: {
    spendingByCategory: Record<string, number>;
    spendingBySubcategory: Record<string, number>;
  };
}

export function CategoryItem({
  category,
  onDelete,
  dragHandle,
  lastMonthSpending,
}: CategoryItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const utils = api.useUtils();

  const updateCategory = api.budget.updateCategory.useMutation({
    onSuccess: () => {
      void utils.budget.getCategories.invalidate();
      toast.success("Category updated successfully");
    },
    onError: (error) => {
      toast.error("Error updating category", {
        description: error.message,
      });
    },
  });

  const updateSubcategory = api.budget.updateSubcategory.useMutation({
    onSuccess: () => {
      void utils.budget.getCategories.invalidate();
      toast.success("Subcategory updated successfully");
    },
    onError: (error) => {
      toast.error("Error updating subcategory", {
        description: error.message,
      });
    },
  });

  const deleteSubcategory = api.budget.deleteSubcategory.useMutation({
    onSuccess: () => {
      void utils.budget.getCategories.invalidate();
      toast.success("Subcategory deleted successfully");
    },
    onError: (error) => {
      toast.error("Error deleting subcategory", {
        description: error.message,
      });
    },
  });

  const calculateCategoryTotal = () => {
    return category.subcategories.reduce(
      (total, sub) => total + Number(sub.targetAmount),
      0,
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  const getLastMonthCategorySpending = () => {
    if (!lastMonthSpending?.spendingByCategory) return 0;
    return lastMonthSpending.spendingByCategory[category.id] || 0;
  };

  const getLastMonthSubcategorySpending = (subcategoryId: string) => {
    if (!lastMonthSpending?.spendingBySubcategory) return 0;
    return lastMonthSpending.spendingBySubcategory[subcategoryId] || 0;
  };

  const handleDeleteSubcategory = (subcategoryId: string) => {
    deleteSubcategory.mutate(subcategoryId);
  };

  const handleUpdateCategory = (newName: string | number) => {
    if (typeof newName === "string" && newName !== category.name) {
      updateCategory.mutate({
        id: category.id,
        name: newName,
        isIncome: category.isIncome,
      });
    }
  };

  const handleUpdateSubcategory = (
    subcategoryId: string,
    field: "name" | "targetAmount",
    value: string | number,
  ) => {
    const subcategory = category.subcategories.find(
      (sub) => sub.id === subcategoryId,
    );
    if (!subcategory) return;

    if (
      (field === "name" &&
        typeof value === "string" &&
        value !== subcategory.name) ||
      (field === "targetAmount" &&
        typeof value === "number" &&
        value !== Number(subcategory.targetAmount))
    ) {
      updateSubcategory.mutate({
        id: subcategoryId,
        name: field === "name" ? (value as string) : subcategory.name,
        targetAmount:
          field === "targetAmount"
            ? (value as number)
            : Number(subcategory.targetAmount),
        categoryId: category.id,
      });
    }
  };

  return (
    <div className="flex items-center rounded-lg border p-4">
      {dragHandle}
      <div className="w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            <InlineEdit
              value={category.name}
              onSave={handleUpdateCategory}
              className="text-lg font-semibold"
            />
            <Badge variant={category.isIncome ? "default" : "destructive"}>
              {category.isIncome ? "Income" : "Expense"}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-right">
              <p className="text-muted-foreground text-sm">Total Target</p>
              <p className="font-medium">
                {formatCurrency(calculateCategoryTotal())}
              </p>
              {getLastMonthCategorySpending() > 0 && (
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(getLastMonthCategorySpending())}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="text-red-500 hover:bg-red-100 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isExpanded && (
          <>
            <SubcategoryForm categoryId={category.id} />

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subcategory</TableHead>
                  <TableHead className="text-right">Target Amount</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {category.subcategories.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-muted-foreground text-center"
                    >
                      No subcategories added yet
                    </TableCell>
                  </TableRow>
                ) : (
                  category.subcategories.map((subcategory) => (
                    <TableRow key={subcategory.id}>
                      <TableCell>
                        <InlineEdit
                          value={subcategory.name}
                          onSave={(value) =>
                            handleUpdateSubcategory(
                              subcategory.id,
                              "name",
                              value,
                            )
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div>
                          <InlineEdit
                            value={Number(subcategory.targetAmount)}
                            onSave={(value) =>
                              handleUpdateSubcategory(
                                subcategory.id,
                                "targetAmount",
                                value,
                              )
                            }
                            type="number"
                            className="text-right"
                          />
                          {getLastMonthSubcategorySpending(subcategory.id) > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {formatCurrency(getLastMonthSubcategorySpending(subcategory.id))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleDeleteSubcategory(subcategory.id)
                          }
                          className="text-red-500 hover:bg-red-100 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </>
        )}
      </div>
    </div>
  );
}
