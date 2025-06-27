"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, TrendingDown, Target, Lightbulb } from "lucide-react";
import { api } from "@/trpc/react";
import { useTimeframe } from "@/components/providers/timeframe-provider";

interface BudgetInsight {
  type: "warning" | "success" | "info" | "danger";
  title: string;
  message: string;
  icon: React.ReactNode;
}

export function BudgetInsights() {
  const { getDateRange } = useTimeframe();
  
  const { data: categories } = api.budget.getCategories.useQuery();
  const { data: transactionsData } = api.transaction.getDashboardData.useQuery({
    dateRange: getDateRange(),
  });

  const generateInsights = (): BudgetInsight[] => {
    const insights: BudgetInsight[] = [];
    
    if (!categories || !transactionsData?.transactions) return insights;

    // Calculate budget vs actual
    const budgetAnalysis = categories
      .filter(category => !category.isIncome)
      .map(category => {
        const categoryTransactions = transactionsData.transactions.filter(
          transaction => 
            transaction.categoryId === category.id && 
            !transaction.isDiscarded
        );

        const actualSpending = categoryTransactions.reduce(
          (sum, transaction) => sum + Math.abs(transaction.amount),
          0
        );

        const budgetTarget = category.subcategories.reduce(
          (sum, subcategory) => sum + Number(subcategory.targetAmount),
          0
        );

        return {
          category: category.name,
          actual: actualSpending,
          budget: budgetTarget,
          variance: budgetTarget - actualSpending,
          percentage: budgetTarget > 0 ? (actualSpending / budgetTarget) * 100 : 0,
        };
      });

    // Check for overspending categories
    const overspendingCategories = budgetAnalysis.filter(item => 
      item.budget > 0 && item.percentage > 100
    );

    if (overspendingCategories.length > 0) {
      const worstCategory = overspendingCategories.reduce((prev, current) => 
        current.percentage > prev.percentage ? current : prev
      );
      
      insights.push({
        type: "danger",
        title: "Budget Overrun",
        message: `${worstCategory.category} is ${worstCategory.percentage.toFixed(0)}% over budget`,
        icon: <AlertTriangle className="h-4 w-4" />,
      });
    }

    // Check for under-budget categories
    const underBudgetCategories = budgetAnalysis.filter(item => 
      item.budget > 0 && item.percentage < 80
    );

    if (underBudgetCategories.length > 0) {
      insights.push({
        type: "success",
        title: "Good Progress",
        message: `${underBudgetCategories.length} categories are under budget`,
        icon: <TrendingDown className="h-4 w-4" />,
      });
    }

    // Check for categories with no budget set
    const noBudgetCategories = budgetAnalysis.filter(item => item.budget === 0);
    if (noBudgetCategories.length > 0) {
      insights.push({
        type: "warning",
        title: "Missing Budgets",
        message: `${noBudgetCategories.length} categories need budget targets`,
        icon: <Target className="h-4 w-4" />,
      });
    }

    // Check for high spending categories
    const totalSpending = budgetAnalysis.reduce((sum, item) => sum + item.actual, 0);
    const highSpendingCategories = budgetAnalysis.filter(item => 
      totalSpending > 0 && (item.actual / totalSpending) > 0.3
    );

    if (highSpendingCategories.length > 0) {
      const highSpendingCategory = highSpendingCategories[0];
      if (highSpendingCategory) {
        insights.push({
          type: "info",
          title: "High Spending",
          message: `${highSpendingCategory.category} represents ${((highSpendingCategory.actual / totalSpending) * 100).toFixed(0)}% of total spending`,
          icon: <TrendingUp className="h-4 w-4" />,
        });
      }
    }

    // General budget tips
    if (insights.length < 3) {
      insights.push({
        type: "info",
        title: "Budget Tip",
        message: "Consider setting up automatic transfers to savings accounts",
        icon: <Lightbulb className="h-4 w-4" />,
      });
    }

    return insights.slice(0, 5); // Limit to 5 insights
  };

  const insights = generateInsights();

  const getInsightColor = (type: string) => {
    switch (type) {
      case "danger":
        return "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400";
      case "success":
        return "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400";
      default:
        return "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Budget Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No insights available yet. Add some transactions to get started.
          </p>
        ) : (
          insights.map((insight, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border ${getInsightColor(insight.type)}`}
            >
              <div className="flex items-start gap-2">
                {insight.icon}
                <div className="flex-1">
                  <p className="font-medium text-sm">{insight.title}</p>
                  <p className="text-xs opacity-90">{insight.message}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
} 