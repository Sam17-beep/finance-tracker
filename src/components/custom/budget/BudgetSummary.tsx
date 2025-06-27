import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type BudgetTotals } from "./types";

interface BudgetSummaryProps {
  totals: BudgetTotals;
}

export function BudgetSummary({ totals }: BudgetSummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-muted-foreground">Total Income</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(totals.income)}
            </p>
          </div>
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(totals.expenses)}
            </p>
          </div>
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-muted-foreground">Balance</p>
            <p
              className={`text-2xl font-bold ${
                totals.balance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              }`}
            >
              {formatCurrency(totals.balance)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 