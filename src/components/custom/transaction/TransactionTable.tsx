"use client";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type RouterOutputs } from "@/trpc/shared";
import { TransactionTableRow } from "./TransactionRow";
import { api } from "@/trpc/react";
import { useState } from "react";
import { type DateRange } from "@/components/ui/DateRangePicker";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TransactionTableProps {
  dateRange: DateRange;
  selectedCategory: string;
  selectedSubcategory: string;
}

export function TransactionTable({
  dateRange,
  selectedCategory,
  selectedSubcategory,
}: TransactionTableProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const utils = api.useUtils();
  const { data: categories } = api.budget.getCategories.useQuery();
  const { data: transactionsData, isLoading } = api.transaction.getAll.useQuery(
    {
      dateRange,
      categoryId: selectedCategory === "any" ? undefined : selectedCategory,
      subcategoryId:
        selectedSubcategory === "any" ? undefined : selectedSubcategory,
      page,
      pageSize,
    },
    {
      refetchOnWindowFocus: true,
      placeholderData: (previousData) => previousData,
      staleTime: 1000 * 60,
    },
  );

  const handleTransactionChange = (
    newTransaction: RouterOutputs["transaction"]["update"],
  ) => {
    // Update the cache for the current query
    utils.transaction.getAll.setData(
      {
        dateRange,
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
    // Update the cache for the current query
    utils.transaction.getAll.setData(
      {
        dateRange,
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
          total: old.total - 1, // Decrement total since we removed one item
        };
      },
    );
  };

  const totalPages = transactionsData
    ? Math.ceil(transactionsData.total / pageSize)
    : 0;

  if (isLoading && !transactionsData) {
    return <div>Loading transactions...</div>;
  }

  if (!transactionsData) {
    return <div>No transactions found</div>;
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Subcategory</TableHead>
            <TableHead>Discarded</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactionsData.transactions.map((transaction) => (
            <TransactionTableRow
              categories={categories ?? []}
              key={transaction.id}
              transaction={transaction}
              propsOnChange={handleTransactionChange}
              propsOnDelete={() => handleTransactionDelete(transaction.id)}
            />
          ))}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-muted-foreground text-sm text-nowrap">
            Showing {transactionsData.transactions.length} of{" "}
            {transactionsData.total} transactions
          </div>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => {
              setPageSize(Number(value));
              setPage(1); // Reset to first page when changing page size
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select page size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 per page</SelectItem>
              <SelectItem value="25">25 per page</SelectItem>
              <SelectItem value="50">50 per page</SelectItem>
              <SelectItem value="100">100 per page</SelectItem>
              <SelectItem value="200">200 per page</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => page > 1 && setPage((p) => p - 1)}
                className={page === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {page > 3 && (
              <>
                <PaginationItem>
                  <PaginationLink onClick={() => setPage(1)}>1</PaginationLink>
                </PaginationItem>
                <PaginationEllipsis />
              </>
            )}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Show pages around current page
              const pageNumber =
                Math.max(1, Math.min(totalPages - 4, page - 2)) + i;

              if (pageNumber > totalPages) return null;

              return (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    onClick={() => setPage(pageNumber)}
                    isActive={page === pageNumber}
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            {page < totalPages - 2 && (
              <>
                <PaginationEllipsis />
                <PaginationItem>
                  <PaginationLink onClick={() => setPage(totalPages)}>
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              </>
            )}
            <PaginationItem>
              <PaginationNext
                onClick={() => page < totalPages && setPage((p) => p + 1)}
                className={
                  page === totalPages ? "pointer-events-none opacity-50" : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
