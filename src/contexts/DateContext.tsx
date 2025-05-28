"use client";

import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
  useMemo,
} from "react";

// Type definitions
export type Mode = "Custom" | "Yearly" | "Monthly";

export interface CustomDateRange {
  startDate: Date;
  endDate: Date;
}

export interface YearlyDate {
  year: number;
}

export interface MonthlyDate {
  year: number;
  month: number; // 1-12
}

// Helper functions for date calculations
const getStartOfMonth = (year: number, month: number /* 1-12 */): Date => {
  return new Date(year, month - 1, 1, 0, 0, 0, 0);
};

const getEndOfMonth = (year: number, month: number /* 1-12 */): Date => {
  return new Date(year, month, 0, 23, 59, 59, 999); // Last day of current month
};

const getStartOfYear = (year: number): Date => {
  return new Date(year, 0, 1, 0, 0, 0, 0);
};

const getEndOfYear = (year: number): Date => {
  return new Date(year, 11, 31, 23, 59, 59, 999);
};

const formatDateToYMD = (date: Date): string => {
  const parts = date.toISOString().split("T");
  return parts[0] ?? "";
};

const getMonthName = (month: number, locale = "en-US"): string => {
  const date = new Date();
  date.setMonth(month - 1);
  return date.toLocaleString(locale, { month: "long" });
};

interface DateContextType {
  mode: Mode;
  beginDate: Date;
  endDate: Date;
  title: string;
  setMode: (newMode: Mode) => void; // Allows manually changing mode, adjusting dates if needed
  setCustomDateRange: (startDate: Date, endDate: Date) => void; // Sets mode to Custom
  setSelectedYear: (year: number) => void; // Sets mode to Yearly
  setSelectedMonth: (year: number, month: number) => void; // Sets mode to Monthly
}

// Context creation
const DateContext = createContext<DateContextType | undefined>(undefined);

// Provider component
interface DateProviderProps {
  children: ReactNode;
}

export const DateProvider: React.FC<DateProviderProps> = ({ children }) => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // 1-12

  const [mode, setModeInternal] = useState<Mode>("Monthly");

  // Internal state for each mode's specific date details
  const [customDatesState, setCustomDatesInternal] = useState<CustomDateRange>({
    startDate: getStartOfMonth(currentYear, currentMonth),
    endDate: getEndOfMonth(currentYear, currentMonth),
  });
  const [yearlyDateState, setYearlyDateInternal] = useState<YearlyDate>({
    year: currentYear,
  });
  const [monthlyDateState, setMonthlyDateInternal] = useState<MonthlyDate>({
    year: currentYear,
    month: currentMonth,
  });

  const handleSetCustomDateRange = (startDate: Date, endDate: Date) => {
    setCustomDatesInternal({ startDate, endDate });
    setModeInternal("Custom");
  };

  const handleSetSelectedYear = (year: number) => {
    setYearlyDateInternal({ year });
    setModeInternal("Yearly");
  };

  const handleSetSelectedMonth = (year: number, month: number) => {
    setMonthlyDateInternal({ year, month });
    setModeInternal("Monthly");
  };

  const derivedDates = useMemo(() => {
    switch (mode) {
      case "Custom":
        return {
          beginDate: customDatesState.startDate,
          endDate: customDatesState.endDate,
        };
      case "Yearly":
        return {
          beginDate: getStartOfYear(yearlyDateState.year),
          endDate: getEndOfYear(yearlyDateState.year),
        };
      case "Monthly":
      default: // Default to monthly if mode is somehow invalid
        return {
          beginDate: getStartOfMonth(
            monthlyDateState.year,
            monthlyDateState.month,
          ),
          endDate: getEndOfMonth(monthlyDateState.year, monthlyDateState.month),
        };
    }
  }, [mode, customDatesState, yearlyDateState, monthlyDateState]);

  const title = useMemo(() => {
    switch (mode) {
      case "Custom":
        return `${formatDateToYMD(derivedDates.beginDate)} - ${formatDateToYMD(derivedDates.endDate)}`;
      case "Yearly":
        return `${yearlyDateState.year}`;
      case "Monthly":
      default:
        return `${getMonthName(monthlyDateState.month)} ${monthlyDateState.year}`;
    }
  }, [mode, derivedDates, yearlyDateState, monthlyDateState]);

  const contextValue = useMemo(() => {
    const handleSetMode = (newMode: Mode) => {
      const oldMode = mode;
      setModeInternal(newMode);

      // When switching TO 'Custom', adjust custom dates based on the previous mode
      if (newMode === "Custom" && oldMode !== "Custom") {
        if (oldMode === "Yearly") {
          setCustomDatesInternal({
            startDate: getStartOfYear(yearlyDateState.year),
            endDate: getEndOfYear(yearlyDateState.year),
          });
        } else if (oldMode === "Monthly") {
          setCustomDatesInternal({
            startDate: getStartOfMonth(
              monthlyDateState.year,
              monthlyDateState.month,
            ),
            endDate: getEndOfMonth(
              monthlyDateState.year,
              monthlyDateState.month,
            ),
          });
        }
        // If oldMode was already 'Custom', customDatesState remains as is.
      }
    };
    return {
      mode,
      beginDate: derivedDates.beginDate,
      endDate: derivedDates.endDate,
      title,
      setMode: handleSetMode,
      setCustomDateRange: handleSetCustomDateRange,
      setSelectedYear: handleSetSelectedYear,
      setSelectedMonth: handleSetSelectedMonth,
    };
  }, [
    mode,
    derivedDates.beginDate,
    derivedDates.endDate,
    title,
    yearlyDateState.year,
    monthlyDateState.year,
    monthlyDateState.month,
  ]);

  return (
    <DateContext.Provider value={contextValue}>{children}</DateContext.Provider>
  );
};

export const useDateContext = (): DateContextType => {
  const context = useContext(DateContext);
  if (!context) {
    throw new Error(
      "useAnalysisContext must be used within an AnalysisProvider",
    );
  }
  return context;
};
