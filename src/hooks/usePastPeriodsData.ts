"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/trpc/react";
import { type PeriodSummary } from "@/domain/Transaction";
import { toast } from "sonner";
import { useDateContext } from "@/components/contexts/DateContext";

const PAST_PERIODS_PAGE_SIZE = 6;


export const usePastPeriodsData = () => {
  const { beginDate, endDate, mode } = useDateContext();
  const [offset, setOffset] = useState(1);
  const [allPastPeriods, setAllPastPeriods] = useState<PeriodSummary[]>([]);
  const [hasMoreData, setHasMoreData] = useState(true);

  const {data, fetchStatus, error, isLoading, isRefetching} = api.transaction.getPeriodSummaries.useQuery({
    numberOfPeriods: PAST_PERIODS_PAGE_SIZE,
    dateRange: { from: beginDate, to: endDate },
    periodMode: mode,
    offset: offset,
  });

  useEffect(() => {
    if (data) {
      const newSummaries = data.summaries ?? [];
      setAllPastPeriods((prev) => 
        offset === 1 && prev.length === 0 && isRefetching ? newSummaries : [...prev, ...newSummaries]
      );
      if (data.hasMore === false) {
        setHasMoreData(false);
      }
    }
  }, [data, offset, isRefetching]);

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
  
  const isLoadingInitial = isLoading && allPastPeriods.length === 0 && offset === 1;

  return {
    allPastPeriods,
    isLoadingInitial,
    isFetchingMore: fetchStatus === "fetching" && allPastPeriods.length > 0,
    fetchMorePeriods,
    error,
    hasMoreData,
  };
}; 