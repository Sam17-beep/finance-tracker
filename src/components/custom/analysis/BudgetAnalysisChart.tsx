"use client";

import React, { useMemo, useState, useEffect } from "react";
import { api } from "@/trpc/react";
import { useDateContext } from "@/components/contexts/DateContext";
import {
  ChartContainer,
  ChartTooltip,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { type BudgetAnalysisItem } from "@/server/api/routers/analysis";
import {
  type TooltipProps,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceLine,
  Bar,
  BarChart,
  Rectangle,
} from "recharts";
import { type BarProps } from "recharts";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface ChartDisplayItem extends BudgetAnalysisItem {
  percentageSpent: number;
}

const CustomTooltipContent = ({
  active,
  payload,
  label,
}: TooltipProps<number, string>) => {
  const dataItem = active ? (payload?.[0]?.payload as ChartDisplayItem) : null;

  if (dataItem) {
    return (
      <div className="bg-background rounded-lg border p-2.5 text-sm shadow-lg">
        <p className="mb-1.5 font-medium">{label}</p>
        <div className="space-y-1">
          <p style={{ color: payload?.[0]?.color ?? "inherit" }}>
            {`Spent: $${Number(dataItem.spending).toLocaleString()} (${dataItem.percentageSpent.toFixed(0)}%)`}
          </p>
          <p>{`Goal: $${Number(dataItem.goal).toLocaleString()}`}</p>
        </div>
      </div>
    );
  }
  return null;
};

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
  } = api.analysis.getBudgetAnalysis.useQuery({
    dateRange: { from: beginDate, to: endDate },
    dateMode: dateContext.mode,
  });

  useEffect(() => {
    if (serverChartData) {
      const initialVisibility: Record<string, boolean> = {};
      serverChartData.forEach((item: BudgetAnalysisItem) => {
        if (item && typeof item.name === "string") {
          initialVisibility[item.name] = true;
        }
      });
      setVisibleCategories(initialVisibility);
    }
  }, [serverChartData]);

  const chartData: ChartDisplayItem[] = useMemo(() => {
    if (!serverChartData) {
      return [];
    }

    const processedData: ChartDisplayItem[] = serverChartData.map(
      (item: BudgetAnalysisItem) => {
        const goal = Number(item.goal) || 0;
        const spending = Number(item.spending) || 0;
        let percentageSpent = 0;

        if (goal > 0) {
          percentageSpent = Math.min((spending / goal) * 100, 200);
        } else if (spending > 0) {
          percentageSpent = 200;
        }

        return {
          ...item,
          goal,
          spending,
          percentageSpent,
        };
      },
    );

    return processedData.filter(
      (item) => item.name && visibleCategories[item.name] !== false,
    );
  }, [serverChartData, visibleCategories]);

  const chartConfig = {
    percentageSpent: {
      label: "Spending (% of Goal)",
      color: "hsl(var(--chart-2))",
    },
    goal: { label: "Goal", color: "hsl(var(--chart-1))" },
    spending: { label: "Spending", color: "hsl(var(--chart-2))" },
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
    <Card>
      <h2 className="text-xl font-semibold">
        Budget Analysis (Goal vs. Spending)
      </h2>
      {serverChartData && serverChartData.length > 0 && (
        <Card className="mx-12 flex flex-row flex-wrap justify-around gap-12 px-12">
          {serverChartData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <Input
                type="checkbox"
                id={`vis-toggle-${item.name.replace(/\s+/g, "-")}`}
                className="h-4 w-4 rounded-2xl"
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
        </Card>
      )}

      {chartData.length === 0 && !isLoadingChartData ? (
        <p className="text-gray-500">
          No data to display. Try selecting categories or a different period.
        </p>
      ) : (
        <ChartContainer config={chartConfig} className="w-full">
          <BarChart data={chartData}>
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
              tickFormatter={(value) => `${Number(value).toFixed(0)}%`}
              domain={[0, "dataMax + 10"]}
            />
            <ReferenceLine
              y={100}
              stroke="var(--chart-5)"
              strokeDasharray="3 3"
              strokeWidth={2}
            />
            <ChartTooltip cursor={false} content={<CustomTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="percentageSpent"
              fill="var(--chart-2)"
              radius={[4, 4, 0, 0]}
              name={chartConfig.percentageSpent.label}
              activeBar={(props: BarProps) => {
                const { x, y, width, height } = props;
                const padding = 4;

                if (
                  typeof x !== "number" ||
                  typeof y !== "number" ||
                  typeof width !== "number" ||
                  typeof height !== "number" ||
                  width <= 0 ||
                  height === undefined
                ) {
                  return (
                    <Rectangle
                      x={0}
                      y={0}
                      width={0}
                      height={0}
                      fill="transparent"
                    />
                  );
                }

                return (
                  <Rectangle
                    x={x - padding}
                    y={y - padding}
                    width={width + 2 * padding}
                    height={height + 2 * padding}
                    fill="var(--chart-3)"
                    radius={6}
                  />
                );
              }}
            />
          </BarChart>
        </ChartContainer>
      )}
    </Card>
  );
};

export default BudgetAnalysisChart;
