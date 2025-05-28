"use client";

import React, { useMemo, useState, useEffect } from "react";
import { api } from "@/trpc/react";
import { useDateContext } from "@/components/contexts/DateContext";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface ChartDataItem {
  name: string;
  goal: number;
  spending: number;
}

const BudgetAnalysisChart = () => {
  const dateContext = useDateContext();
  const { beginDate, endDate } = dateContext;

  const [visibleCategories, setVisibleCategories] = useState<
    Record<string, boolean>
  >({});

  const {
    data: serverChartData,
    isLoading: isLoadingChartData,
    error: chartDataError,
  } = api.analysis.getBudgetAnalysisChartData.useQuery({
    dateRange: { from: beginDate, to: endDate },
    dateMode: dateContext.mode,
  });

  useEffect(() => {
    if (serverChartData) {
      const initialVisibility: Record<string, boolean> = {};
      serverChartData.forEach((item) => {
        initialVisibility[item.name] = true;
      });
      setVisibleCategories(initialVisibility);
    }
  }, [serverChartData]);

  const chartData: ChartDataItem[] = useMemo(() => {
    if (!serverChartData || Object.keys(visibleCategories).length === 0) {
      return [];
    }
    return serverChartData.filter(
      (item) => visibleCategories[item.name] !== false,
    );
  }, [serverChartData, visibleCategories]);

  const chartConfig = {
    goal: {
      label: "Goal",
      color: "hsl(var(--chart-1))",
    },
    spending: {
      label: "Spending",
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig;

  if (!beginDate || !endDate) {
    return <p className="text-gray-500">Please select a date range.</p>;
  }

  if (isLoadingChartData) {
    return <p className="text-gray-500">Loading chart data...</p>;
  }

  if (chartDataError) {
    return (
      <p className="text-red-500">
        Error loading chart data: {chartDataError.message}
      </p>
    );
  }

  return (
    <section className="mt-8 rounded-lg p-4 shadow-sm md:p-6 dark:bg-slate-700">
      <h2 className="mb-4 text-xl font-semibold">
        Budget Analysis (Goal vs. Spending)
      </h2>
      <div className="min-h-[300px] rounded-lg border border-dashed border-gray-300 p-4 sm:min-h-[400px]">
        {serverChartData && serverChartData.length > 0 && (
          <div className="mb-4 grid grid-cols-2 gap-2 rounded-md border p-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {serverChartData.map((item) => (
              <div key={item.name} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`vis-toggle-${item.name.replace(/\s+/g, "-")}`}
                  className="form-checkbox text-primary-600 focus:ring-primary-500 h-4 w-4 rounded border-gray-300 transition duration-150 ease-in-out"
                  checked={visibleCategories[item.name] !== false}
                  onChange={() => {
                    setVisibleCategories((prev) => ({
                      ...prev,
                      [item.name]: !prev[item.name],
                    }));
                  }}
                />
                <label
                  htmlFor={`vis-toggle-${item.name.replace(/\s+/g, "-")}`}
                  className="text-sm select-none"
                >
                  {item.name}
                </label>
              </div>
            ))}
          </div>
        )}

        {chartData.length === 0 && !isLoadingChartData ? (
          <p className="text-gray-500">
            No data to display. Try selecting categories or a different period.
          </p>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="min-h-[300px] w-full sm:min-h-[450px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  tickFormatter={(value) =>
                    `$${Number(value).toLocaleString()}`
                  }
                />
                <ChartTooltip
                  cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                  content={<ChartTooltipContent hideLabel />}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="goal"
                  fill="var(--color-goal)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="spending"
                  fill="var(--color-spending)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </div>
    </section>
  );
};

export default BudgetAnalysisChart;
