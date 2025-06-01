"use client";

import React, { useEffect, useState } from "react";
import PeriodSummaryDisplay from "./PeriodSummaryDisplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Loader2 } from "lucide-react";
import { usePastPeriodsData } from "@/hooks/usePastPeriodsData";
import { Card } from "@/components/ui/card";
import { type PeriodSummary } from "@/domain/Transaction";

const PastPeriodsCarousel = () => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const {
    allPastPeriods,
    isLoadingInitial,
    isFetchingMore,
    fetchMorePeriods,
    error,
    hasMoreData,
  } = usePastPeriodsData();

  useEffect(() => {
    if (!api) {
      return;
    }

    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });

    if (current >= allPastPeriods.length - 5) {
      fetchMorePeriods();
    }
  }, [api, current, allPastPeriods.length, fetchMorePeriods]);

  if (isLoadingInitial) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        <p className="text-muted-foreground ml-2">Loading past periods...</p>
      </div>
    );
  }

  if (!isLoadingInitial && allPastPeriods.length === 0 && !error) {
    return (
      <p className="text-muted-foreground text-center">
        No past periods to display.
      </p>
    );
  }

  if (error && allPastPeriods.length === 0) return null;

  if (allPastPeriods.length === 0) return null;

  return (
    <div className="w-full px-12 md:px-16 lg:px-20">
      <h2 className="mb-4 text-center text-lg font-semibold">Past Periods</h2>
      <Carousel
        opts={{
          align: "start",
          slidesToScroll: 1,
        }}
        setApi={setApi}
      >
        <CarouselPrevious />
        <CarouselContent>
          {allPastPeriods.map((period: PeriodSummary, index: number) => (
            <CarouselItem
              key={`${period.periodTitle}-${index}`}
              className="basis-full md:basis-1/3 lg:basis-1/5"
            >
              <Card
                className={`flex h-full max-h-[400px] flex-col items-center`}
              >
                <PeriodSummaryDisplay
                  periodLabel={period.periodTitle}
                  income={period.income}
                  expenses={period.expenses}
                  isCurrent={false}
                />
              </Card>
            </CarouselItem>
          ))}
          {isFetchingMore && (
            <CarouselItem className="flex items-center justify-center p-4 pl-2 md:basis-1/3 md:pl-4 lg:basis-1/5">
              <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
            </CarouselItem>
          )}
        </CarouselContent>
        {hasMoreData ? (
          <CarouselNext />
        ) : (
          <Popover>
            <PopoverTrigger asChild>
              <span tabIndex={0} className="cursor-not-allowed">
                <CarouselNext disabled className="pointer-events-none" />
              </span>
            </PopoverTrigger>
            <PopoverContent>
              <p>No more periods to display.</p>
            </PopoverContent>
          </Popover>
        )}
      </Carousel>
    </div>
  );
};

export default PastPeriodsCarousel;
