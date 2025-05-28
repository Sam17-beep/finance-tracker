"use client";

import React from "react";

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
  const spendingPercentage = income > 0 ? (expenses / income) * 100 : 0;
  const cappedPercentage = Math.min(spendingPercentage, 100); // Cap at 100% for the graph
  const radius = isCurrent ? 60 : 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (cappedPercentage / 100) * circumference;

  const balance = income - expenses;
  const isOverBudget = balance < 0;
  const balanceText = isOverBudget
    ? `$${Math.abs(balance).toFixed(2)} over`
    : `$${balance.toFixed(2)} left`;

  const circleColor = isOverBudget ? "stroke-red-500" : "stroke-green-500";
  const textColor = isOverBudget ? "text-red-500" : "text-green-500";

  return (
    <div
      className={`border-primary/10 flex flex-col items-center border p-4 ${
        isCurrent
          ? "bg-foreground-secondary rounded-lg"
          : "bg-foreground-secondary rounded-md"
      }`}
    >
      <h3
        className={`text-sm font-semibold ${isCurrent ? "mb-2 text-lg" : "mb-1"} dark:text-white`}
      >
        {periodLabel}
      </h3>
      <div className="relative">
        <svg
          width={isCurrent ? "140" : "100"}
          height={isCurrent ? "140" : "100"}
          viewBox={isCurrent ? "0 0 140 140" : "0 0 100 100"}
          className="-rotate-90 transform"
        >
          <circle
            cx={isCurrent ? "70" : "50"}
            cy={isCurrent ? "70" : "50"}
            r={radius}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={isCurrent ? "12" : "8"}
            fill="transparent"
          />
          <circle
            cx={isCurrent ? "70" : "50"}
            cy={isCurrent ? "70" : "50"}
            r={radius}
            className={`${circleColor} transition-all duration-500 ease-in-out`}
            strokeWidth={isCurrent ? "12" : "8"}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`text-xs ${isCurrent ? "text-base" : ""} font-bold dark:text-white`}
          >
            {`${Math.round(spendingPercentage)}%`}
          </span>
          {isCurrent && (
            <span className="text-muted-foreground text-xs">spent</span>
          )}
        </div>
      </div>
      <p
        className={`mt-2 text-xs ${isCurrent ? "text-base font-medium" : "font-normal"} ${textColor}`}
      >
        {balanceText}
      </p>
    </div>
  );
};

export default PeriodSummaryDisplay;
