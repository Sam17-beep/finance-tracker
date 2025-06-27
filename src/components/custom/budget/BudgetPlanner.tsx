"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { BudgetSummary } from "./BudgetSummary";
import { CategoryForm } from "./CategoryForm";
import { SortableCategories } from "./SortableCategories";
import { type BudgetTotals, type Category } from "./types";
import { useTimeframe } from "@/components/providers/timeframe-provider";
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  DollarSign,
  Calendar
} from "lucide-react";

export function BudgetPlanner() {
  const [activeTab, setActiveTab] = useState("planning");
  const { getDateRange, getTimeframeLabel } = useTimeframe();
  
  const utils = api.useUtils();
  const { data: categories = [] } = api.budget.getCategories.useQuery();
  const { data: transactionsData } = api.transaction.getDashboardData.useQuery({
    dateRange: getDateRange(),
  });

  // Get last month's spending data
  const getLastMonthRange = () => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: lastMonth, to: lastMonthEnd };
  };

  const { data: lastMonthSpending } = api.transaction.getLastMonthSpending.useQuery({
    dateRange: getLastMonthRange(),
  });

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
        0
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

  const calculateBudgetVsActual = () => {
    if (!transactionsData?.transactions) return [];

    return categories
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

        const variance = budgetTarget - actualSpending;
        const percentage = budgetTarget > 0 ? (actualSpending / budgetTarget) * 100 : 0;

        return {
          category: category.name,
          actual: actualSpending,
          budget: budgetTarget,
          variance,
          percentage,
          status: percentage > 100 ? "over" : percentage > 80 ? "warning" : "good",
        };
      })
      .sort((a, b) => b.actual - a.actual);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "over":
        return "text-red-600 dark:text-red-400";
      case "warning":
        return "text-yellow-600 dark:text-yellow-400";
      case "good":
        return "text-green-600 dark:text-green-400";
      default:
        return "text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "over":
        return <AlertTriangle className="h-4 w-4" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      case "good":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  const handleDeleteCategory = (categoryId: string) => {
    deleteCategory.mutate(categoryId);
  };

  const budgetVsActual = calculateBudgetVsActual();
  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      <BudgetSummary totals={totals} />
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="planning" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Planning
          </TabsTrigger>
          <TabsTrigger value="tracking" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Tracking
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="planning" className="space-y-6">
          <CategoryForm />
          
          <Card>
            <CardHeader>
              <CardTitle>Budget Categories</CardTitle>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No categories added yet. Add a category to get started.
                </p>
              ) : (
                <SortableCategories
                  categories={categories}
                  onDeleteCategory={handleDeleteCategory}
                  lastMonthSpending={lastMonthSpending}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tracking" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Budget vs Actual Spending</CardTitle>
              <p className="text-sm text-muted-foreground">
                Comparing your budget targets with actual spending for {getTimeframeLabel()}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {budgetVsActual.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No budget categories or transactions found. Add some categories and transactions to see tracking data.
                </p>
              ) : (
                budgetVsActual.map((item) => (
                  <div key={item.category} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.category}</span>
                        <Badge variant="outline" className={getStatusColor(item.status)}>
                          {getStatusIcon(item.status)}
                          <span className="ml-1">
                            {item.status === "over" ? "Over Budget" : 
                             item.status === "warning" ? "Near Limit" : "On Track"}
                          </span>
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Variance</p>
                        <p className={`font-medium ${item.variance >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatCurrency(Math.abs(item.variance))}
                          {item.variance >= 0 ? " under" : " over"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{item.percentage.toFixed(1)}% of budget</span>
                      </div>
                      <Progress 
                        value={Math.min(100, item.percentage)} 
                        className="h-2"
                        style={{
                          '--progress-background': item.percentage > 100 ? 'hsl(var(--destructive))' : 
                                                  item.percentage > 80 ? 'hsl(var(--warning))' : 
                                                  'hsl(var(--primary))'
                        } as React.CSSProperties}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Budget:</span>
                        <span className="ml-2 font-medium">{formatCurrency(item.budget)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Actual:</span>
                        <span className="ml-2 font-medium">{formatCurrency(item.actual)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">On Track</span>
                    <Badge variant="default">
                      {budgetVsActual.filter(item => item.status === "good").length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Near Limit</span>
                    <Badge variant="secondary">
                      {budgetVsActual.filter(item => item.status === "warning").length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Over Budget</span>
                    <Badge variant="destructive">
                      {budgetVsActual.filter(item => item.status === "over").length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Spending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {budgetVsActual.slice(0, 5).map((item, index) => (
                    <div key={item.category} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{index + 1}.</span>
                        <span className="text-sm">{item.category}</span>
                      </div>
                      <span className="text-sm font-medium">{formatCurrency(item.actual)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Budget Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {budgetVsActual.filter(item => item.status === "over").length > 0 && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-400">
                      <strong>Action Required:</strong> {budgetVsActual.filter(item => item.status === "over").length} categories over budget. 
                      Consider reducing spending or adjusting targets.
                    </p>
                  </div>
                )}
                
                {budgetVsActual.filter(item => item.status === "warning").length > 0 && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-400">
                      <strong>Monitor:</strong> {budgetVsActual.filter(item => item.status === "warning").length} categories approaching limits. 
                      Keep an eye on spending in these areas.
                    </p>
                  </div>
                )}

                {budgetVsActual.filter(item => item.status === "good").length > 0 && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm text-green-800 dark:text-green-400">
                      <strong>Great Job:</strong> {budgetVsActual.filter(item => item.status === "good").length} categories within budget. 
                      Consider reallocating surplus to savings or debt reduction.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 