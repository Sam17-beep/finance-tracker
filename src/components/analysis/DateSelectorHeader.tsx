"use client";

import React from "react";
import { useDateContext } from "@/components/contexts/DateContext";
import { Mode } from "@/domain/Date";

const DateSelectorHeader: React.FC = () => {
  const {
    mode,
    title,
    beginDate,
    endDate,
    setMode,
    setSelectedMonth,
    setSelectedYear,
    setCustomDateRange,
  } = useDateContext();

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const year = parseInt(e.target.value, 10);
    if (!isNaN(year)) {
      if (mode === Mode.Yearly) {
        setSelectedYear(year);
      } else if (mode === Mode.Monthly) {
        setSelectedMonth(year, beginDate.getMonth() + 1);
      }
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const month = parseInt(e.target.value, 10);
    if (!isNaN(month) && mode === Mode.Monthly) {
      setSelectedMonth(beginDate.getFullYear(), month);
    }
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDateString = e.target.value;
    if (!newStartDateString) return;
    const newStartDate = new Date(newStartDateString + "T00:00:00");

    if (!isNaN(newStartDate.getTime()) && mode === Mode.Custom) {
      const currentEndDate =
        endDate > newStartDate
          ? endDate
          : new Date(newStartDate.getTime() + 86400000);
      setCustomDateRange(newStartDate, currentEndDate);
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDateString = e.target.value;
    if (!newEndDateString) return;
    const newEndDate = new Date(newEndDateString + "T00:00:00");

    if (!isNaN(newEndDate.getTime()) && mode === Mode.Custom) {
      const currentStartDate =
        beginDate < newEndDate
          ? beginDate
          : new Date(newEndDate.getTime() - 86400000);
      setCustomDateRange(currentStartDate, newEndDate);
    }
  };

  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split("T")[0] ?? "";
  };

  const currentInputYear = beginDate.getFullYear();
  const currentInputMonth = beginDate.getMonth() + 1;

  return (
    <div className="bg-card text-card-foreground rounded-lg p-4 shadow">
      <h2 className="mb-3 text-xl font-semibold">{title}</h2>

      <div className="mb-4 flex items-center space-x-2">
        {(["Monthly", "Yearly", "Custom"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-md px-4 py-2 text-sm font-medium ${mode === m ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {mode === Mode.Monthly && (
          <>
            <div>
              <label
                htmlFor="year-input-monthly"
                className="text-muted-foreground block text-sm font-medium"
              >
                Year:
              </label>
              <input
                type="number"
                id="year-input-monthly"
                value={currentInputYear}
                onChange={handleYearChange}
                placeholder="YYYY"
                className="border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring focus-visible:ring-offset-background mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus-visible:ring-2 focus-visible:outline-none sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="month-input"
                className="text-muted-foreground block text-sm font-medium"
              >
                Month:
              </label>
              <select
                id="month-input"
                value={currentInputMonth}
                onChange={handleMonthChange}
                className="border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring focus-visible:ring-offset-background mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus-visible:ring-2 focus-visible:outline-none sm:text-sm"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((monthNum) => (
                  <option key={monthNum} value={monthNum}>
                    {new Date(currentInputYear, monthNum - 1).toLocaleString(
                      "default",
                      {
                        month: "long",
                      },
                    )}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {mode === Mode.Yearly && (
          <div>
            <label
              htmlFor="year-input-yearly"
              className="text-muted-foreground block text-sm font-medium"
            >
              Year:
            </label>
            <input
              type="number"
              id="year-input-yearly"
              value={currentInputYear}
              onChange={handleYearChange}
              placeholder="YYYY"
              className="border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring focus-visible:ring-offset-background mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus-visible:ring-2 focus-visible:outline-none sm:text-sm"
            />
          </div>
        )}

        {mode === Mode.Custom && (
          <>
            <div>
              <label
                htmlFor="start-date-input"
                className="text-muted-foreground block text-sm font-medium"
              >
                Start Date:
              </label>
              <input
                type="date"
                id="start-date-input"
                value={formatDateForInput(beginDate)}
                onChange={handleStartDateChange}
                max={formatDateForInput(endDate)}
                className="border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring focus-visible:ring-offset-background mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus-visible:ring-2 focus-visible:outline-none sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="end-date-input"
                className="text-muted-foreground block text-sm font-medium"
              >
                End Date:
              </label>
              <input
                type="date"
                id="end-date-input"
                value={formatDateForInput(endDate)}
                onChange={handleEndDateChange}
                min={formatDateForInput(beginDate)}
                className="border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring focus-visible:ring-offset-background mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus-visible:ring-2 focus-visible:outline-none sm:text-sm"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DateSelectorHeader;
