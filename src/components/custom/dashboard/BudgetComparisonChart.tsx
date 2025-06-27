"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { api } from "@/trpc/react";
import { format, startOfMonth, endOfMonth, subDays, startOfDay, endOfDay, subMonths } from "date-fns";
import { useTimeframe } from "@/components/providers/timeframe-provider";

export function BudgetComparisonChart() {
  const { getDateRange, getTimeframeLabel } = useTimeframe();

  const { data: categories } = api.budget.getCategories.useQuery();
  const { data: transactionsData } = api.transaction.getDashboardData.useQuery({
    dateRange: getDateRange(),
  });

  const processData = () => {
    if (!categories || !transactionsData?.transactions) return [];

    return categories
      .filter(category => !category.isIncome) // Only show expense categories
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
        };
      })
      .filter(item => item.budget > 0) // Only show categories with budget targets
      .sort((a, b) => b.actual - a.actual); // Sort by actual spending
  };

  const chartData = processData();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget vs Actual Spending</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            actual: { label: "Actual Spending", color: "hsl(var(--chart-1))" },
            budget: { label: "Budget Target", color: "hsl(var(--chart-2))" },
          }}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="actual"
                fill="hsl(var(--chart-1))"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="budget"
                fill="hsl(var(--chart-2))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
} 