"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { BalanceSummary } from "./BalanceSummary";
import { CategoryForm } from "./CategoryForm";
import { SortableCategories } from "./SortableCategories";
import { type BudgetTotals, type Category } from "./types";

export function BudgetPlanner() {
  const utils = api.useUtils();
  const { data: categories = [] } = api.budget.getCategories.useQuery();
  const deleteCategory = api.budget.deleteCategory.useMutation({
    onSuccess: () => {
      void utils.budget.getCategories.invalidate();
      toast.success("Category deleted successfully");
    },
    onError: (error) => {
      toast.error("Error deleting category", {
        description: error.message,
      });
    },
  });

  const calculateTotals = (): BudgetTotals => {
    let totalIncome = 0;
    let totalExpenses = 0;

    categories.forEach((category: Category) => {
      const categoryTotal = category.subcategories.reduce(
        (total: number, sub) => total + Number(sub.targetAmount),
        0,
      );
      if (category.isIncome) {
        totalIncome += categoryTotal;
      } else {
        totalExpenses += categoryTotal;
      }
    });

    return {
      income: totalIncome,
      expenses: totalExpenses,
      balance: totalIncome - totalExpenses,
    };
  };

  const handleDeleteCategory = (categoryId: string) => {
    deleteCategory.mutate(categoryId);
  };

  return (
    <div className="space-y-8">
      <BalanceSummary totals={calculateTotals()} title="Budget Summary" />
      <CategoryForm />

      <Card>
        <CardHeader>
          <CardTitle>Budget Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center">
              No categories added yet. Add a category to get started.
            </p>
          ) : (
            <SortableCategories
              categories={categories}
              onDeleteCategory={handleDeleteCategory}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
