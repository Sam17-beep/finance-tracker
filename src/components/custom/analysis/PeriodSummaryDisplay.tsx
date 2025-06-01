"use client";

import React from "react";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface PeriodSummaryDisplayProps {
  periodLabel: string;
  income: number;
  expenses: number;
  isCurrent: boolean;
}

const PeriodSummaryDisplay: React.FC<PeriodSummaryDisplayProps> = ({
  periodLabel,
  income,
  expenses,
  isCurrent,
}) => {
  const spending = Math.max(0, expenses);

  const percentageSpent =
    income > 0 ? (spending / income) * 100 : spending > 0 ? 100 : 0;
  const displayPercentage = Math.min(percentageSpent, 100);
  const overBudgetPercentage = Math.max(0, percentageSpent - 100);

  const balance = income - expenses;
  const isOverBudget = balance < 0;

  const balanceText = isOverBudget
    ? `$${Math.abs(balance).toFixed(2)} over`
    : `$${balance.toFixed(2)} left`;

  const pieData = [
    {
      name: "Spent",
      value: displayPercentage,
      fill: isOverBudget ? "var(--destructive)" : "var(--success)",
    },
    {
      name: "Remaining",
      value: 100 - displayPercentage,
      fill: "var(--border)",
    },
  ];

  if (overBudgetPercentage > 0) {
    pieData.push({
      name: "Over Budget",
      value: overBudgetPercentage,
      fill: "var(--destructive)",
    });
    if (percentageSpent > 100) {
      if (pieData[0]) {
        pieData[0].value = 100;
      }
      if (pieData[1]) {
        pieData[1].value = 0;
      }
    }
  }

  const chartSize = isCurrent ? 140 : 100;
  const innerRadius = isCurrent ? 50 : 35;
  const outerRadius = isCurrent ? 70 : 50;

  return (
    <>
      <CardHeader className="w-full">
        <CardTitle
          className={`${isCurrent ? "text-lg" : "text-md"} text-center font-semibold`}
        >
          {periodLabel}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex h-full flex-col items-center justify-center">
        <div
          style={{ width: chartSize, height: chartSize }}
          className="relative"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                stroke="none"
                isAnimationActive={true}
                animationDuration={1000}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={`font-bold ${isCurrent ? "text-base" : "text-xs"}`}
            >
              {`${Math.round(percentageSpent)}%`}
            </span>
            <span className="text-muted-foreground text-xs">spent</span>
          </div>
        </div>
        <CardDescription
          className={`mt-3 font-medium ${isCurrent ? "text-base" : "text-xs"} ${isOverBudget ? "text-destructive" : "text-success"}`}
        >
          {balanceText}
        </CardDescription>
      </CardContent>
    </>
  );
};

export default PeriodSummaryDisplay;
