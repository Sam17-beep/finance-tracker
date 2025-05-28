import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type BudgetTotals } from "./types";

interface BalanceSummaryProps {
  totals: BudgetTotals;
  title: string;
}

export function BalanceSummary({ totals, title }: BalanceSummaryProps) {
  return (
    <Card className={"flex h-full flex-col"}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-center">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex-1 rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
            <p className="text-muted-foreground text-sm">Total Income</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              ${totals.income.toFixed(2)}
            </p>
          </div>
          <div className="flex-1 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
            <p className="text-muted-foreground text-sm">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              ${totals.expenses.toFixed(2)}
            </p>
          </div>
          <div className="flex-1 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
            <p className="text-muted-foreground text-sm">Balance</p>
            <p
              className={`text-2xl font-bold ${
                totals.balance >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              ${totals.balance.toFixed(2)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
