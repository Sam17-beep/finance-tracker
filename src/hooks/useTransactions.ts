import { api } from "@/trpc/react";
import { useDateContext } from "@/components/contexts/DateContext";
import { type RouterOutputs } from "@/trpc/shared";

interface UseTransactionsProps {
  selectedCategory: string;
  selectedSubcategory: string;
  page: number;
  pageSize: number;
}

export function useTransactions({
  selectedCategory,
  selectedSubcategory,
  page,
  pageSize,
}: UseTransactionsProps) {
  const { beginDate, endDate } = useDateContext();
  const utils = api.useUtils();


  const {
    data: transactionsData,
    isLoading,
    error,
  } = api.transaction.getAll.useQuery(
    {
      page,
      pageSize,
      dateRange: { from: beginDate, to: endDate },
      categoryId: selectedCategory === "any" ? undefined : selectedCategory,
      subcategoryId:
        selectedSubcategory === "any" ? undefined : selectedSubcategory,
    },
  );

  const handleTransactionChange = (
    newTransaction: RouterOutputs["transaction"]["update"],
  ) => {
    utils.transaction.getAll.setData(
      {
        dateRange: { from: beginDate, to: endDate },
        categoryId: selectedCategory === "any" ? undefined : selectedCategory,
        subcategoryId:
          selectedSubcategory === "any" ? undefined : selectedSubcategory,
        page,
        pageSize,
      },
      (old) => {
        if (!old) return old;
        return {
          ...old,
          transactions: old.transactions.map((t) =>
            t.id === newTransaction.id ? newTransaction : t,
          ),
        };
      },
    );
  };

  const handleTransactionDelete = (transactionId: string) => {
    utils.transaction.getAll.setData(
      {
        dateRange: { from: beginDate, to: endDate },
        categoryId: selectedCategory === "any" ? undefined : selectedCategory,
        subcategoryId:
          selectedSubcategory === "any" ? undefined : selectedSubcategory,
        page,
        pageSize,
      },
      (old) => {
        if (!old) return old;
        return {
          ...old,
          transactions: old.transactions.filter((t) => t.id !== transactionId),
          total: old.total - 1,
        };
      },
    );
  };

  return {
    transactionsData,
    isLoading,
    error,
    handleTransactionChange,
    handleTransactionDelete,
  };
} 