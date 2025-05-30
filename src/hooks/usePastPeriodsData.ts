"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { api } from "@/trpc/react";
import { Mode } from "@/domain/Date";
import { type PeriodSummary } from "@/server/api/routers/transaction";
import { toast } from "sonner";
import { useDateContext } from "@/components/contexts/DateContext";

const PAST_PERIODS_PAGE_SIZE = 6;

interface UsePastPeriodsDataProps {
  initialOffset?: number;
}

export const usePastPeriodsData = ({
  initialOffset = 1,
}: UsePastPeriodsDataProps) => {
  const { beginDate, endDate, mode } = useDateContext();
  const [offset, setOffset] = useState(initialOffset);
  const [allPastPeriods, setAllPastPeriods] = useState<PeriodSummary[]>([]);
  const [hasMoreData, setHasMoreData] = useState(true);

  const queryInput = useMemo(() => ({
    periodMode: mode,
    customPeriodBegin: mode === Mode.Custom ? beginDate : undefined,
    customPeriodEnd: mode === Mode.Custom ? endDate : undefined,
    numberOfPeriods: PAST_PERIODS_PAGE_SIZE,
    offset: offset,
  }), [mode, beginDate, endDate, offset]);

  const {data, fetchStatus, error, isLoading, isRefetching} = api.transaction.getPeriodSummaries.useQuery(queryInput);

  useEffect(() => {
    if (data) {
      const newSummaries = data.summaries ?? [];
      setAllPastPeriods((prev) => 
        offset === initialOffset && prev.length === 0 && isRefetching ? newSummaries : [...prev, ...newSummaries]
      );
      if (data.hasMore === false) {
        setHasMoreData(false);
      }
    }
  }, [data, offset, initialOffset, isRefetching]);

  useEffect(() => {
    if (error) {
      toast.error(`Error fetching past periods: ${error.message}`);
    }
  }, [error]);

  const fetchMorePeriods = useCallback(() => {
    if (fetchStatus === "fetching") return;
    if (!hasMoreData) return;
    setOffset((prevOffset) => prevOffset + PAST_PERIODS_PAGE_SIZE);
  }, [fetchStatus, hasMoreData]);
  
  const isLoadingInitial = isLoading && allPastPeriods.length === 0 && offset === initialOffset;

  return {
    allPastPeriods,
    isLoadingInitial,
    isFetchingMore: fetchStatus === "fetching" && allPastPeriods.length > 0,
    fetchMorePeriods,
    error,
    hasMoreData,
  };
}; 