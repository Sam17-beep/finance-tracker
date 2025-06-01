"use client";

import { api } from "@/trpc/react";
import PastPeriodsCarousel from "./PastPeriodsCarousel";
import { useDateContext } from "@/components/contexts/DateContext";
import { Mode } from "@/domain/Date";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Streak = () => {
  const { beginDate, mode } = useDateContext();

  const { data: streakData } = api.transaction.getBudgetStreak.useQuery({
    periodMode: mode,
    currentPeriodBeginDate: beginDate,
  });

  const streakCount = streakData?.streak ?? 0;
  const streakUnit =
    streakData?.unit ?? (mode === Mode.Yearly ? "year" : "month");

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Streaks & Periods</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-8">
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
