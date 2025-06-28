"use client";

import { Button } from "@/components/ui/button";
import { useActiveBudget } from "@/hooks/useActiveBudget";

export function BudgetSwitcher() {
  const { activeBudget, budgets, switchBudget } = useActiveBudget();

  return (
    <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
      <span className="text-sm font-medium">Active Budget:</span>
      {budgets.map((budget) => (
        <Button
          key={budget.id}
          variant={activeBudget?.id === budget.id ? "default" : "outline"}
          size="sm"
          onClick={() => switchBudget(budget.id)}
        >
          {budget.name}
        </Button>
      ))}
    </div>
  );
} 