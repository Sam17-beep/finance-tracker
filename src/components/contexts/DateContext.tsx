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
  numberOfMonthsInPeriod,
  getPeriodTitle,
  getPeriodLabel,
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
  setMode: (newMode: Mode) => void;
  setCustomDateRange: (startDate: Date, endDate: Date) => void;
  setSelectedYear: (year: number) => void;
  setSelectedMonth: (year: number, month: number) => void;
  periodLabel: string;
}

const DateContext = createContext<DateContextType | undefined>(undefined);

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
    return getPeriodTitle(
      derivedDates.beginDate,
      derivedDates.endDate,
      mode,
    );
  }, [mode, derivedDates]);

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
      periodLabel: getPeriodLabel(mode),
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
