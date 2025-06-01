import { add, sub } from "date-fns";

export interface DateRange {
    from: Date;
    to: Date;
};

export enum Mode {
  Custom = "Custom",
  Yearly = "Yearly",
  Monthly = "Monthly",
}

export interface CustomDateRange {
  startDate: Date;
  endDate: Date;
}

export interface YearlyDate {
  year: number;
}

export interface MonthlyDate {
  year: number;
  month: number;
}

export const getStartOfMonth = (year: number, month: number): Date => {
  return new Date(year, month - 1, 1, 0, 0, 0, 0);
};

export const getEndOfMonth = (year: number, month: number): Date => {
  return new Date(year, month, 0, 23, 59, 59, 999);
};

export const getStartOfYear = (year: number): Date => {
  return new Date(year, 0, 1, 0, 0, 0, 0);
};

export const getEndOfYear = (year: number): Date => {
  return new Date(year, 11, 31, 23, 59, 59, 999);
};

export const formatDateToYMD = (date: Date): string => {
  const parts = date.toISOString().split("T");
  return parts[0] ?? "";
};

export const getMonthName = (month: number, locale = "en-US"): string => {
  const date = new Date();
  date.setMonth(month - 1);
  return date.toLocaleString(locale, { month: "long" });
};

export const countDaysInPeriod = (startDate: Date, endDate: Date): number => {
  return (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) + 1;
};

export const getPeriodTitle = (startDate: Date, endDate: Date, mode: Mode): string => {
  switch (mode) {
    case Mode.Custom:
      return `${formatDateToYMD(startDate)} - ${formatDateToYMD(endDate)}`;
    case Mode.Yearly:
      return `${startDate.getFullYear()}`;
    case Mode.Monthly:
      return `${getMonthName(startDate.getMonth())} ${startDate.getFullYear()}`;
  }
}

export const getPeriodLabel = (mode: Mode): string => {
  return mode === Mode.Custom ? 'Period' : mode === Mode.Yearly ? 'Year' : 'Month'
}

export const getNextPeriodFromLastPeriod = (startDate: Date, endDate: Date, mode: Mode): DateRange => {
  switch (mode) {
    case Mode.Yearly:
      return { from: add(startDate, { years: 1 }), to: add(endDate, { years: 1 }) };
    case Mode.Monthly:
      return { from: add(startDate, { months: 1 }), to: add(endDate, { months: 1 }) };
    case Mode.Custom:
      return { from: add(startDate, { days: countDaysInPeriod(startDate, endDate) }), to: add(endDate, { days: countDaysInPeriod(startDate, endDate) }) };
  }
}

export const getPreviousPeriodFromLastPeriod = (startDate: Date, endDate: Date, mode: Mode): DateRange => {
  switch (mode) {
    case Mode.Yearly:
      return { from: sub(startDate, { years: 1 }), to: sub(endDate, { years: 1 }) };
    case Mode.Monthly:
      return { from: sub(startDate, { months: 1 }), to: sub(endDate, { months: 1 }) };
    case Mode.Custom:
      return { from: sub(startDate, { days: countDaysInPeriod(startDate, endDate) }), to: sub(endDate, { days: countDaysInPeriod(startDate, endDate) }) };
  }
}

export const numberOfMonthsInPeriod = (
  startDate: Date,
  endDate: Date,
  mode: Mode,
): number => {
  switch (mode) {
    case Mode.Yearly:
      return 12;
    case Mode.Monthly:
      return 1;
    case Mode.Custom:
      return (countDaysInPeriod(startDate, endDate) / 365) * 12;
  }
};
