"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export type TimeframeType = "7d" | "30d" | "90d" | "6m" | "currentMonth" | "lastMonth" | "last3Months" | "last6Months";

interface TimeframeContextType {
  timeframe: TimeframeType;
  setTimeframe: (timeframe: TimeframeType) => void;
  getDateRange: () => { from: Date; to: Date };
  getTimeframeLabel: () => string;
}

const TimeframeContext = createContext<TimeframeContextType | undefined>(undefined);

export function TimeframeProvider({ children }: { children: ReactNode }) {
  const [timeframe, setTimeframe] = useState<TimeframeType>("lastMonth");

  const getDateRange = () => {
    const now = new Date();
    const { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, subMonths } = require("date-fns");
    
    switch (timeframe) {
      case "7d":
        return {
          from: startOfDay(subDays(now, 7)),
          to: endOfDay(now),
        };
      case "30d":
        return {
          from: startOfDay(subDays(now, 30)),
          to: endOfDay(now),
        };
      case "90d":
        return {
          from: startOfDay(subDays(now, 90)),
          to: endOfDay(now),
        };
      case "6m":
        return {
          from: startOfDay(subMonths(now, 6)),
          to: endOfDay(now),
        };
      case "currentMonth":
        return {
          from: startOfMonth(now),
          to: endOfMonth(now),
        };
      case "lastMonth":
        return {
          from: startOfMonth(subMonths(now, 1)),
          to: endOfMonth(subMonths(now, 1)),
        };
      case "last3Months":
        return {
          from: startOfDay(subMonths(now, 3)),
          to: endOfDay(now),
        };
      case "last6Months":
        return {
          from: startOfDay(subMonths(now, 6)),
          to: endOfDay(now),
        };
      default:
        return {
          from: startOfDay(subDays(now, 30)),
          to: endOfDay(now),
        };
    }
  };

  const getTimeframeLabel = () => {
    switch (timeframe) {
      case "7d":
        return "Last 7 Days";
      case "30d":
        return "Last 30 Days";
      case "90d":
        return "Last 90 Days";
      case "6m":
        return "Last 6 Months";
      case "currentMonth":
        return "This Month";
      case "lastMonth":
        return "Last Month";
      case "last3Months":
        return "Last 3 Months";
      case "last6Months":
        return "Last 6 Months";
      default:
        return "Last 30 Days";
    }
  };

  return (
    <TimeframeContext.Provider value={{ timeframe, setTimeframe, getDateRange, getTimeframeLabel }}>
      {children}
    </TimeframeContext.Provider>
  );
}

export function useTimeframe() {
  const context = useContext(TimeframeContext);
  if (context === undefined) {
    throw new Error("useTimeframe must be used within a TimeframeProvider");
  }
  return context;
} 