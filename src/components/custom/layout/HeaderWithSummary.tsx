"use client";

import { type ReactNode } from "react";
import DateSelectorHeader from "@/components/custom/filter/DateSelectorHeader";
import { BalanceSummary } from "@/components/custom/budget/BalanceSummary";
import { useDateContext } from "@/components/contexts/DateContext";
import { useTransactionSummary } from "@/hooks/useTransactionSummary";

interface HeaderWithSummaryProps {
  children?: ReactNode;
  selectedCategory?: string;
  selectedSubcategory?: string;
}

export function HeaderWithSummary({
  children,
  selectedCategory,
  selectedSubcategory,
}: HeaderWithSummaryProps) {
  const { title: dateTitle } = useDateContext();
  const { summaryData, isLoadingSummary, summaryError } = useTransactionSummary(
    {
      selectedCategory,
      selectedSubcategory,
    },
  );

  return (
    <div className="mb-6 flex flex-col gap-6 lg:flex-row lg:items-stretch">
      <div className="flex flex-1 flex-col">
        <DateSelectorHeader>{children}</DateSelectorHeader>
      </div>
      <div className="flex flex-1 flex-col">
        {isLoadingSummary && (
          <p className="flex h-full items-center justify-center">
            Loading summary...
          </p>
        )}
        {summaryError && (
          <p className="flex h-full items-center justify-center text-red-500">
            Error loading summary: {summaryError.message}
          </p>
        )}
        {summaryData && (
          <BalanceSummary
            totals={summaryData}
            title={`Summary for ${dateTitle}`}
          />
        )}
        {!isLoadingSummary && !summaryError && !summaryData && (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed p-4">
            <p className="text-muted-foreground">No summary data available.</p>
          </div>
        )}
      </div>
    </div>
  );
}
