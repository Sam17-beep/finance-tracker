"use client";

import { api } from "@/trpc/react";
import PeriodSummaryDisplay from "./PeriodSummaryDisplay";
import PastPeriodsCarousel from "./PastPeriodsCarousel";
import { useDateContext } from "@/components/contexts/DateContext";
import { Mode } from "@/domain/Date";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const Streak = () => {
  const { beginDate, endDate, mode } = useDateContext();

  const {
    data: summariesData,
    isLoading: isLoadingSummaries,
    error: errorSummaries,
  } = api.transaction.getPeriodSummaries.useQuery({
    periodMode: mode,
    customPeriodBegin: mode === Mode.Custom ? beginDate : undefined,
    customPeriodEnd: mode === Mode.Custom ? endDate : undefined,
    numberOfPeriods: 1,
  });
  const currentPeriod = summariesData?.summaries?.[0];

  const {
    data: streakData,
    isLoading: isLoadingStreak,
    error: errorStreak,
  } = api.transaction.getBudgetStreak.useQuery({
    periodMode: mode,
    currentPeriodBeginDate: beginDate,
  });

  const isLoading = isLoadingSummaries || isLoadingStreak;
  const error = errorSummaries ?? errorStreak;

  if (isLoading) {
    return (
      <Card className="flex h-64 items-center justify-center">
        <CardContent className="flex flex-col items-center">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          <p className="text-muted-foreground mt-2">Loading budget streak...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive bg-destructive/10 my-4">
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
        </CardHeader>
        <CardContent className="text-destructive">
          <p>Error loading budget data: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  const streakCount = streakData?.streak ?? 0;
  const streakUnit =
    streakData?.unit ?? (mode === Mode.Yearly ? "year" : "month");

  let currentPeriodTitle = "Current Period";
  if (mode === Mode.Monthly) currentPeriodTitle = "Current Month";
  else if (mode === Mode.Yearly) currentPeriodTitle = "Current Year";
  else if (mode === Mode.Custom && currentPeriod)
    currentPeriodTitle = "Custom Range";

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Streaks & Periods</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-8">
        <div className="flex flex-col items-center gap-3">
          <h2 className="text-center text-xl font-semibold">
            {currentPeriodTitle}
          </h2>
          {currentPeriod ? (
            <PeriodSummaryDisplay
              periodLabel={currentPeriod.periodLabel}
              income={currentPeriod.income}
              expenses={currentPeriod.expenses}
              isCurrent={true}
            />
          ) : (
            <p className="text-muted-foreground">No data for current period.</p>
          )}
        </div>

        <div className="flex flex-col items-center justify-center gap-2">
          <h2
            className={`text-2xl font-bold ${streakCount > 0 ? "text-orange-400" : "text-muted-foreground"}`}
          >
            🔥 {streakCount} {streakUnit}
            {streakCount !== 1 ? "s" : ""} streak 🔥
          </h2>
        </div>

        <PastPeriodsCarousel />
      </CardContent>
    </Card>
  );
};

export default Streak;
