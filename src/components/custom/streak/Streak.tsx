"use client";

import { api } from "@/trpc/react";
import PeriodSummaryDisplay from "./PeriodSummaryDisplay";
import { useDateContext } from "@/components/contexts/DateContext";
import { Mode } from "@/domain/Date";

const Streak = () => {
  const { beginDate, endDate, mode } = useDateContext();

  const {
    data: summaries,
    isLoading: isLoadingSummaries,
    error: errorSummaries,
  } = api.transaction.getPeriodSummaries.useQuery({
    periodMode: mode,
    customPeriodBegin: mode === Mode.Custom ? beginDate : undefined,
    customPeriodEnd: mode === Mode.Custom ? endDate : undefined,
  });

  const {
    data: streakData,
    isLoading: isLoadingStreak,
    error: errorStreak,
  } = api.transaction.getBudgetStreak.useQuery({
    periodMode: mode,
    currentPeriodBeginDate: beginDate, // Use beginDate of the current context
  });

  const isLoading = isLoadingSummaries || isLoadingStreak;
  const error = errorSummaries ?? errorStreak;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-gray-500">Loading budget streak...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-4 rounded border border-red-400 bg-red-100 p-4 text-red-700">
        <p>Error loading budget data: {error.message}</p>
      </div>
    );
  }

  // Ensure summaries is an array even if it comes back null/undefined from the query
  const validSummaries = Array.isArray(summaries) ? summaries : [];
  const currentPeriod = validSummaries[0];
  const pastPeriods = validSummaries.slice(1);
  const streakCount = streakData?.streak ?? 0;
  const streakUnit =
    streakData?.unit ?? (mode === Mode.Yearly ? "year" : "month");

  // Determine the title for the current period section
  let currentPeriodTitle = "Current Period";
  if (mode === Mode.Monthly) currentPeriodTitle = "Current Month";
  else if (mode === Mode.Yearly) currentPeriodTitle = "Current Year";
  else if (mode === Mode.Custom && currentPeriod)
    currentPeriodTitle = "Custom Range";

  return (
    <section className="bg-background flex flex-col justify-center rounded-lg p-4 shadow-sm md:flex-row md:space-x-6 md:p-6">
      {/* Current Period Display */}
      {currentPeriod && (
        <div className="mb-6 flex flex-col items-center md:mb-0">
          <h2 className="mb-3 text-xl font-semibold">{currentPeriodTitle}</h2>
          <PeriodSummaryDisplay
            periodLabel={currentPeriod.periodLabel}
            income={currentPeriod.income}
            expenses={currentPeriod.expenses}
            isCurrent={true}
          />
        </div>
      )}
      {!currentPeriod && !isLoading && (
        <div className="mb-6 flex flex-col items-center md:mb-0">
          <h2 className="mb-3 text-xl font-semibold">{currentPeriodTitle}</h2>
          <p className="text-gray-500">No data for current period.</p>
        </div>
      )}

      {/* Past Periods & Streak Display */}
      <div className="flex h-full flex-col items-center justify-between">
        {streakCount > 0 && (
          <h2 className="mb-1 text-center text-lg font-semibold text-orange-400">
            🔥 {streakCount} {streakUnit}
            {streakCount > 1 ? "s" : ""} streak 🔥
          </h2>
        )}
        {pastPeriods.length > 0 && (
          <div className="flex flex-wrap justify-center md:justify-start">
            {pastPeriods.map((period) => (
              <div key={period.periodLabel} className="m-1">
                <PeriodSummaryDisplay
                  periodLabel={period.periodLabel}
                  income={period.income}
                  expenses={period.expenses}
                  isCurrent={false}
                />
              </div>
            ))}
          </div>
        )}
        {/* Show message if no past periods AND streak is 0, but current period might exist */}
        {pastPeriods.length === 0 && streakCount === 0 && (
          <p className="mt-2 text-center text-gray-400 md:text-left">
            No past period data or streak to show.
          </p>
        )}
      </div>
    </section>
  );
};

export default Streak;
