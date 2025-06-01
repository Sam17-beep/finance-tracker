"use client";

import { api } from "@/trpc/react";
import PeriodSummaryDisplay from "./PeriodSummaryDisplay";
import { useDateContext } from "@/components/contexts/DateContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const CurrentPeriodCard = () => {
  const { beginDate, endDate, periodLabel } = useDateContext();

  const {
    data: summary,
    isLoading,
    error,
  } = api.transaction.getPeriodSummary.useQuery({
    dateRange: {
      from: beginDate,
      to: endDate,
    },
  });

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

  return (
    <Card className="w-full md:w-1/2 lg:w-1/3">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{`Current ${periodLabel} Status`}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-8">
        {summary ? (
          <PeriodSummaryDisplay
            periodLabel={summary.periodLabel}
            income={summary.income}
            expenses={summary.expenses}
            isCurrent={true}
          />
        ) : (
          <p className="text-muted-foreground">No data for current period.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default CurrentPeriodCard;
