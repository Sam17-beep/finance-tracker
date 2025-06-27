import { BudgetPlanner } from "@/components/custom/budget/BudgetPlanner";
import { DeleteBudgetButton } from "@/components/custom/budget/DeleteBudgetButton";

export default function Budget() {
  return (
    <main className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Budget Planner</h1>
          <p className="text-muted-foreground mt-1">
            Plan your finances and track your progress
          </p>
        </div>
        <DeleteBudgetButton />
      </div>
      
      <div className="max-w-4xl mx-auto">
        <BudgetPlanner />
      </div>
    </main>
  );
}
