"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { api } from "@/trpc/react";
import { startOfMonth, endOfMonth, subDays, startOfDay, endOfDay } from "date-fns";
import { useTimeframe } from "@/components/providers/timeframe-provider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function MonthlySpendingChart() {
  const { getDateRange, getTimeframeLabel } = useTimeframe();
  const [showSubcategories, setShowSubcategories] = useState(false);
  
  const { data: categories } = api.budget.getCategories.useQuery();
  const { data: transactionsData } = api.transaction.getDashboardData.useQuery({
    dateRange: getDateRange(),
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  const processData = () => {
    if (!categories || !transactionsData?.transactions) return [];

    if (showSubcategories) {
      // Process data by subcategories
      const subcategorySpending = new Map<string, number>();

      // Aggregate spending by subcategory
      transactionsData.transactions.forEach(transaction => {
        if (transaction.isDiscarded || !transaction.category || transaction.category.isIncome) return;
        
        if (transaction.subcategory) {
          const key = `${transaction.category.name} - ${transaction.subcategory.name}`;
          const current = subcategorySpending.get(key) || 0;
          subcategorySpending.set(key, current + Math.abs(transaction.amount));
        }
      });

      // Convert to array and filter out zero spending
      return Array.from(subcategorySpending.entries())
        .filter(([_, amount]) => amount > 0)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value); // Sort by spending amount
    } else {
      // Process data by categories (original logic)
      const categorySpending = new Map<string, number>();

      // Initialize all expense categories
      categories
        .filter(category => !category.isIncome)
        .forEach(category => {
          categorySpending.set(category.name, 0);
        });

      // Aggregate spending by category
      transactionsData.transactions.forEach(transaction => {
        if (transaction.isDiscarded || !transaction.category || transaction.category.isIncome) return;
        
        const current = categorySpending.get(transaction.category.name) || 0;
        categorySpending.set(transaction.category.name, current + Math.abs(transaction.amount));
      });

      // Convert to array and filter out zero spending
      return Array.from(categorySpending.entries())
        .filter(([_, amount]) => amount > 0)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value); // Sort by spending amount
    }
  };

  const chartData = processData();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Spending by {showSubcategories ? 'Subcategory' : 'Category'}</CardTitle>
          <div className="flex items-center space-x-2">
            <Switch
              id="show-subcategories"
              checked={showSubcategories}
              onCheckedChange={setShowSubcategories}
            />
            <Label htmlFor="show-subcategories" className="text-sm">
              Show Subcategories
            </Label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={Object.fromEntries(
            chartData.map((item, index) => [
              item.name,
              { 
                label: item.name, 
                color: COLORS[index % COLORS.length] 
              }
            ])
          )}
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="40%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius="60%"
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        {/* Custom legend below the chart */}
        <div className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {chartData.map((entry, index) => (
              <div key={entry.name} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="truncate">{entry.name}</span>
                <span className="text-muted-foreground font-mono">
                  {formatCurrency(entry.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 