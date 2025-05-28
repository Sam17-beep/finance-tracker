"use client";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TransactionTableRow } from "./TransactionRow";
import { CustomPagination } from "@/components/ui/CustomPagination";
import { useTransactions } from "@/hooks/useTransactions";
import { useState } from "react";
import { api } from "@/trpc/react";

interface TransactionTableProps {
  selectedCategory: string;
  selectedSubcategory: string;
}

export function TransactionTable({
  selectedCategory,
  selectedSubcategory,
}: TransactionTableProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const { data: categories } = api.budget.getCategories.useQuery();

  const {
    transactionsData,
    isLoading,
    error,
    handleTransactionChange,
    handleTransactionDelete,
  } = useTransactions({
    selectedCategory,
    selectedSubcategory,
    page,
    pageSize,
  });

  if (isLoading && !transactionsData) {
    return <div>Loading transactions...</div>;
  }

  if (error) {
    return <div>Error loading transactions: {error.message}</div>;
  }

  if (!transactionsData || transactionsData.transactions.length === 0) {
    return <div>No transactions found for the selected criteria.</div>;
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
      <CustomPagination
        currentPage={page}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        numberOfItems={transactionsData.total}
      />
    </div>
  );
}
