"use client";

import {
  Mode,
  type CustomDateRange,
  type YearlyDate,
  type MonthlyDate,
  getStartOfMonth,
  getEndOfMonth,
  getStartOfYear,
  getEndOfYear,
  formatDateToYMD,
  getMonthName,
  numberOfMonthsInPeriod,
} from "@/domain/Date";
import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
  useMemo,
} from "react";

interface DateContextType {
  mode: Mode;
  beginDate: Date;
  endDate: Date;
  title: string;
  numberOfMonths: number;
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
  const currentMonth = today.getMonth() + 1;

  const [mode, setModeInternal] = useState<Mode>(Mode.Monthly);

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
    setModeInternal(Mode.Custom);
  };

  const handleSetSelectedYear = (year: number) => {
    setYearlyDateInternal({ year });
    setModeInternal(Mode.Yearly);
  };

  const handleSetSelectedMonth = (year: number, month: number) => {
    setMonthlyDateInternal({ year, month });
    setModeInternal(Mode.Monthly);
  };

  const derivedDates = useMemo(() => {
    switch (mode) {
      case Mode.Custom:
        return {
          beginDate: customDatesState.startDate,
          endDate: customDatesState.endDate,
        };
      case Mode.Yearly:
        return {
          beginDate: getStartOfYear(yearlyDateState.year),
          endDate: getEndOfYear(yearlyDateState.year),
        };
      case Mode.Monthly:
      default:
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
      case Mode.Custom:
        return `${formatDateToYMD(derivedDates.beginDate)} - ${formatDateToYMD(derivedDates.endDate)}`;
      case Mode.Yearly:
        return `${yearlyDateState.year}`;
      case Mode.Monthly:
        return `${getMonthName(monthlyDateState.month)} ${monthlyDateState.year}`;
    }
  }, [mode, derivedDates, yearlyDateState, monthlyDateState]);

  const numberOfMonths = useMemo(
    () =>
      numberOfMonthsInPeriod(
        derivedDates.beginDate,
        derivedDates.endDate,
        mode,
      ),
    [mode, derivedDates.beginDate, derivedDates.endDate],
  );

  const contextValue = useMemo(() => {
    const handleSetMode = (newMode: Mode) => {
      const oldMode = mode;
      setModeInternal(newMode);

      if (newMode === Mode.Custom && oldMode !== Mode.Custom) {
        if (oldMode === Mode.Yearly) {
          setCustomDatesInternal({
            startDate: getStartOfYear(yearlyDateState.year),
            endDate: getEndOfYear(yearlyDateState.year),
          });
        } else if (oldMode === Mode.Monthly) {
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
      }
    };
    return {
      mode,
      beginDate: derivedDates.beginDate,
      endDate: derivedDates.endDate,
      title,
      numberOfMonths,
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
    numberOfMonths,
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
    throw new Error("useDateContext must be used within a DateProvider");
  }
  return context;
};
