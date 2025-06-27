"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { startOfMonth, endOfMonth, format, subDays, startOfDay, endOfDay } from "date-fns";
import { TrendingUp, TrendingDown, DollarSign, Target } from "lucide-react";
import { useTimeframe } from "@/components/providers/timeframe-provider";

export function DashboardStats() {
  const { getDateRange, getTimeframeLabel } = useTimeframe();
  
  const { data: categories, isLoading: categoriesLoading } = api.budget.getCategories.useQuery();
  const { data: transactionsData, isLoading: transactionsLoading } = api.transaction.getDashboardData.useQuery({
    dateRange: getDateRange(),
  });

  const isLoading = categoriesLoading || transactionsLoading;

  const calculateStats = () => {
    if (isLoading) {
      return {
        totalIncome: 0,
        totalExpenses: 0,
        netIncome: 0,
        budgetTarget: 0,
        budgetVariance: 0,
      };
    }

    if (!categories || !transactionsData?.transactions) {
      console.log("Missing data - categories:", !!categories, "transactions:", !!transactionsData?.transactions);
      return {
        totalIncome: 0,
        totalExpenses: 0,
        netIncome: 0,
        budgetTarget: 0,
        budgetVariance: 0,
      };
    }

    console.log("Categories:", categories);
    console.log("Transactions:", transactionsData.transactions);
    
    // Log first few transactions in detail
    console.log("=== SAMPLE TRANSACTIONS ===");
    transactionsData.transactions.slice(0, 3).forEach((transaction, index) => {
      console.log(`Sample transaction ${index + 1}:`, {
        id: transaction.id,
        name: transaction.name,
        amount: transaction.amount,
        amountType: typeof transaction.amount,
        date: transaction.date,
        categoryId: transaction.categoryId,
        category: transaction.category,
        isDiscarded: transaction.isDiscarded,
        subcategoryId: transaction.subcategoryId,
        subcategory: transaction.subcategory,
      });
    });

    let totalIncome = 0;
    let totalExpenses = 0;
    let budgetTarget = 0;

    try {
      // Calculate income and expenses
      transactionsData.transactions.forEach(transaction => {
        if (transaction.isDiscarded) {
          console.log(`Skipping discarded transaction: ${transaction.name}`);
          return;
        }
        
        const amount = Number(transaction.amount) || 0;
        const isIncome = transaction.category?.isIncome || false;
        const categoryName = transaction.category?.name || 'No Category';
        
        console.log(`Processing transaction: ${transaction.name}`);
        console.log(`  Amount: ${transaction.amount} (parsed: ${amount})`);
        console.log(`  Category: ${categoryName}`);
        console.log(`  isIncome: ${isIncome}`);
        console.log(`  Raw category object:`, transaction.category);
        
        // Handle transactions without categories as expenses
        if (isIncome) {
          totalIncome += amount;
          console.log(`  → Added to income: ${amount}, Total income now: ${totalIncome}`);
        } else {
          const expenseAmount = Math.abs(amount);
          totalExpenses += expenseAmount;
          console.log(`  → Added to expenses: ${expenseAmount}, Total expenses now: ${totalExpenses}`);
        }
      });

      console.log("=== FINAL TOTALS ===");
      console.log("Total Income:", totalIncome);
      console.log("Total Expenses:", totalExpenses);
      console.log("All transactions processed:", transactionsData.transactions.length);
      console.log("Non-discarded transactions:", transactionsData.transactions.filter(t => !t.isDiscarded).length);
      console.log("Income transactions:", transactionsData.transactions.filter(t => !t.isDiscarded && t.category?.isIncome).length);
      console.log("Expense transactions:", transactionsData.transactions.filter(t => !t.isDiscarded && !t.category?.isIncome).length);
      console.log("Uncategorized transactions:", transactionsData.transactions.filter(t => !t.isDiscarded && !t.category).length);

      // Calculate budget targets
      categories
        .filter(category => !category.isIncome)
        .forEach(category => {
          const categoryBudget = category.subcategories.reduce(
            (sum, subcategory) => sum + Number(subcategory.targetAmount || 0),
            0
          );
          budgetTarget += categoryBudget;
        });

      const netIncome = totalIncome - totalExpenses;
      const budgetVariance = budgetTarget - totalExpenses;

      // Manual verification calculation
      const nonDiscardedTransactions = transactionsData.transactions.filter(t => !t.isDiscarded);
      const incomeTransactions = nonDiscardedTransactions.filter(t => t.category?.isIncome);
      const expenseTransactions = nonDiscardedTransactions.filter(t => !t.category?.isIncome);
      
      const manualIncomeTotal = incomeTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const manualExpenseTotal = expenseTransactions.reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0);
      
      console.log("=== MANUAL VERIFICATION ===");
      console.log("Manual income total:", manualIncomeTotal);
      console.log("Manual expense total:", manualExpenseTotal);
      console.log("Income transactions count:", incomeTransactions.length);
      console.log("Expense transactions count:", expenseTransactions.length);
      
      if (Math.abs(manualIncomeTotal - totalIncome) > 0.01) {
        console.error("INCOME CALCULATION MISMATCH!");
        console.error("Expected:", manualIncomeTotal, "Got:", totalIncome);
      }
      
      if (Math.abs(manualExpenseTotal - totalExpenses) > 0.01) {
        console.error("EXPENSE CALCULATION MISMATCH!");
        console.error("Expected:", manualExpenseTotal, "Got:", totalExpenses);
      }

      return {
        totalIncome,
        totalExpenses,
        netIncome,
        budgetTarget,
        budgetVariance,
      };
    } catch (error) {
      console.error("Error calculating stats:", error);
      return {
        totalIncome: 0,
        totalExpenses: 0,
        netIncome: 0,
        budgetTarget: 0,
        budgetVariance: 0,
      };
    }
  };

  const stats = calculateStats();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-20 bg-muted animate-pulse rounded mb-2" />
              <div className="h-3 w-16 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Check if we have any data
  const hasTransactions = transactionsData?.transactions && transactionsData.transactions.length > 0;
  const hasCategories = categories && categories.length > 0;

  if (!hasTransactions && !hasCategories) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="col-span-full">
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-medium">No data available</p>
              <p className="text-sm">Add some transactions and categories to see your financial stats</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(stats.totalIncome)}
          </div>
          <p className="text-xs text-muted-foreground">
            {getTimeframeLabel()}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(stats.totalExpenses)}
          </div>
          <p className="text-xs text-muted-foreground">
            {getTimeframeLabel()}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Income</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${stats.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(stats.netIncome)}
          </div>
          <p className="text-xs text-muted-foreground">
            {getTimeframeLabel()}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Budget Variance</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${stats.budgetVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(stats.budgetVariance)}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.budgetVariance >= 0 ? 'Under budget' : 'Over budget'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 