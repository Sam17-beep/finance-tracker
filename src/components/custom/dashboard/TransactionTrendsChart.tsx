"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from "recharts";
import { api } from "@/trpc/react";
import { format, subDays, startOfDay, endOfDay, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTimeframe } from "@/components/providers/timeframe-provider";

export function TransactionTrendsChart() {
  const [chartType, setChartType] = useState<"netWorth" | "spendingPatterns">("netWorth");
  const { getDateRange } = useTimeframe();

  const { data: transactionsData } = api.transaction.getDashboardData.useQuery({
    dateRange: getDateRange(),
  });

  const processNetWorthData = () => {
    if (!transactionsData?.transactions) return [];

    const dateMap = new Map<string, { income: number; expenses: number }>();
    
    // Initialize all dates in range
    const { from, to } = getDateRange();
    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      const dateKey = format(d, "yyyy-MM-dd");
      dateMap.set(dateKey, { income: 0, expenses: 0 });
    }

    // Aggregate transactions by date
    transactionsData.transactions.forEach(transaction => {
      if (transaction.isDiscarded) return;
      
      const dateKey = format(transaction.date, "yyyy-MM-dd");
      const current = dateMap.get(dateKey) || { income: 0, expenses: 0 };
      
      if (transaction.category?.isIncome) {
        current.income += transaction.amount;
      } else {
        current.expenses += Math.abs(transaction.amount);
      }
      
      dateMap.set(dateKey, current);
    });

    // Convert to cumulative net worth
    let cumulativeNet = 0;
    return Array.from(dateMap.entries())
      .map(([date, data]) => {
        const dailyNet = data.income - data.expenses;
        cumulativeNet += dailyNet;
        return {
          date: format(new Date(date), "MMM dd"),
          netWorth: cumulativeNet,
          dailyNet: dailyNet,
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const processSpendingPatterns = () => {
    if (!transactionsData?.transactions) return [];

    // Group transactions by day of week
    const dayOfWeekMap = new Map<string, { total: number; count: number }>();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    days.forEach(day => {
      dayOfWeekMap.set(day, { total: 0, count: 0 });
    });

    transactionsData.transactions.forEach(transaction => {
      if (transaction.isDiscarded || transaction.category?.isIncome) return;
      
      const dayOfWeek = format(transaction.date, 'EEEE');
      const current = dayOfWeekMap.get(dayOfWeek) || { total: 0, count: 0 };
      current.total += Math.abs(transaction.amount);
      current.count += 1;
      dayOfWeekMap.set(dayOfWeek, current);
    });

    return days.map(day => {
      const data = dayOfWeekMap.get(day) || { total: 0, count: 0 };
      return {
        day: day.slice(0, 3),
        averageSpending: data.count > 0 ? data.total / data.count : 0,
        totalSpending: data.total,
        transactionCount: data.count,
      };
    });
  };

  const netWorthData = processNetWorthData();
  const spendingPatternsData = processSpendingPatterns();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Financial Trends</CardTitle>
          <Select value={chartType} onValueChange={(value: "netWorth" | "spendingPatterns") => setChartType(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="netWorth">Net Worth Trend</SelectItem>
              <SelectItem value="spendingPatterns">Spending Patterns</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {chartType === "netWorth" ? (
          <ChartContainer
            config={{
              netWorth: { label: "Cumulative Net Worth", color: "hsl(var(--chart-1))" },
              dailyNet: { label: "Daily Net", color: "hsl(var(--chart-2))" },
            }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={netWorthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line
                  type="monotone"
                  dataKey="netWorth"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={3}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="dailyNet"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <ChartContainer
            config={{
              averageSpending: { label: "Average Spending per Transaction", color: "hsl(var(--chart-3))" },
              totalSpending: { label: "Total Spending", color: "hsl(var(--chart-4))" },
            }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={spendingPatternsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="averageSpending" fill="hsl(var(--chart-3))" />
                <Bar dataKey="totalSpending" fill="hsl(var(--chart-4))" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
} 