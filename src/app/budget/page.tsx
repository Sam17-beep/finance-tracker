import { BudgetPlanner } from "@/components/custom/budget/BudgetPlanner";

export default function Budget() {
  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Personal Budget Planner</h1>
      <BudgetPlanner />
    </main>
  );
}
