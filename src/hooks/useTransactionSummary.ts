import { api } from "@/trpc/react";
import { useDateContext } from "@/components/contexts/DateContext";

interface UseTransactionSummaryProps {
  selectedCategory?: string;
  selectedSubcategory?: string;
}

export function useTransactionSummary({
  selectedCategory,
  selectedSubcategory,
}: UseTransactionSummaryProps) {
  const { beginDate, endDate } = useDateContext();

  const {
    data: summaryData,
    isLoading: isLoadingSummary,
    error: summaryError,
  } = api.transaction.getPeriodSummary.useQuery(
    {
      dateRange: { from: beginDate, to: endDate },
      categoryId: !selectedCategory || selectedCategory === "any" ? undefined : selectedCategory,
      subcategoryId: !selectedSubcategory || selectedSubcategory === "any" ? undefined : selectedSubcategory,
    },
  );

  return {
    summaryData,
    isLoadingSummary,
    summaryError,
  };
} 
