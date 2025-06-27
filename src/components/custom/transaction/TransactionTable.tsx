"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type RouterOutputs } from "@/trpc/shared";
import { TransactionTableRow } from "./TransactionRow";
import { api } from "@/trpc/react";
import { useState, useMemo } from "react";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Search, 
  Filter,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Hash,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";

interface TransactionTableProps {
  dateRange: DateRange;
  selectedCategory: string;
  selectedSubcategory: string;
}

type SortField = "date" | "name" | "amount" | "category" | "subcategory";
type SortDirection = "asc" | "desc";

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

export function TransactionTable({
  dateRange,
  selectedCategory,
  selectedSubcategory,
}: TransactionTableProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: "date", direction: "desc" });
  const [searchTerm, setSearchTerm] = useState("");
  const [showDiscarded, setShowDiscarded] = useState(false);
  const [showUncategorizedOnly, setShowUncategorizedOnly] = useState(false);
  
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

  // Enhanced filtering and sorting
  const filteredAndSortedTransactions = useMemo(() => {
    if (!transactionsData?.transactions) return [];

    let filtered = transactionsData.transactions;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.category?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.subcategory?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply discarded filter
    if (!showDiscarded) {
      filtered = filtered.filter(transaction => !transaction.isDiscarded);
    }

    // Apply uncategorized filter
    if (showUncategorizedOnly) {
      filtered = filtered.filter(transaction => !transaction.categoryId);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.field) {
        case "date":
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "amount":
          aValue = Math.abs(a.amount);
          bValue = Math.abs(b.amount);
          break;
        case "category":
          aValue = a.category?.name?.toLowerCase() || "";
          bValue = b.category?.name?.toLowerCase() || "";
          break;
        case "subcategory":
          aValue = a.subcategory?.name?.toLowerCase() || "";
          bValue = b.subcategory?.name?.toLowerCase() || "";
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [transactionsData?.transactions, searchTerm, showDiscarded, showUncategorizedOnly, sortConfig]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!filteredAndSortedTransactions.length) return null;

    const totalAmount = filteredAndSortedTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const avgAmount = totalAmount / filteredAndSortedTransactions.length;
    const maxAmount = Math.max(...filteredAndSortedTransactions.map(t => Math.abs(t.amount)));
    const minAmount = Math.min(...filteredAndSortedTransactions.map(t => Math.abs(t.amount)));
    
    const categorizedCount = filteredAndSortedTransactions.filter(t => t.categoryId).length;
    const uncategorizedCount = filteredAndSortedTransactions.length - categorizedCount;
    
    const topCategories = Object.entries(
      filteredAndSortedTransactions
        .filter(t => t.category?.name)
        .reduce((acc, t) => {
          const catName = t.category!.name;
          acc[catName] = (acc[catName] || 0) + Math.abs(t.amount);
          return acc;
        }, {} as Record<string, number>)
    )
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);

    return {
      totalAmount,
      avgAmount,
      maxAmount,
      minAmount,
      categorizedCount,
      uncategorizedCount,
      topCategories,
      totalTransactions: filteredAndSortedTransactions.length
    };
  }, [filteredAndSortedTransactions]);

  const handleSort = (field: SortField) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  const getSortIcon = (field: SortField) => {
    if (sortConfig.field !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortConfig.direction === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  const handleTransactionChange = (
    newTransaction: RouterOutputs["transaction"]["update"],
  ) => {
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
          total: old.total - 1,
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
    <div className="space-y-6">
      {/* Summary Statistics */}
      {summaryStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summaryStats.totalAmount)}</div>
              <p className="text-xs text-muted-foreground">
                {summaryStats.totalTransactions} transactions
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summaryStats.avgAmount)}</div>
              <p className="text-xs text-muted-foreground">
                per transaction
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {showUncategorizedOnly ? "Uncategorized" : "Categorized"}
              </CardTitle>
              <Hash className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {showUncategorizedOnly ? summaryStats.uncategorizedCount : summaryStats.categorizedCount}
              </div>
              <p className="text-xs text-muted-foreground">
                {showUncategorizedOnly 
                  ? "need categorization" 
                  : `${summaryStats.uncategorizedCount} uncategorized`
                }
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {showUncategorizedOnly ? "Largest Transaction" : "Top Category"}
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {showUncategorizedOnly 
                  ? formatCurrency(summaryStats.maxAmount)
                  : (summaryStats.topCategories[0]?.[0] || "None")
                }
              </div>
              <p className="text-xs text-muted-foreground">
                {showUncategorizedOnly 
                  ? "highest amount"
                  : (summaryStats.topCategories[0] && formatCurrency(summaryStats.topCategories[0][1]))
                }
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enhanced Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions, categories, or subcategories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={showDiscarded ? "default" : "outline"}
                size="sm"
                onClick={() => setShowDiscarded(!showDiscarded)}
              >
                Show Discarded
              </Button>
              <Button
                variant={showUncategorizedOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowUncategorizedOnly(!showUncategorizedOnly)}
                className="flex items-center gap-2"
              >
                <AlertCircle className="h-4 w-4" />
                {showUncategorizedOnly ? "Show All" : "Uncategorized Only"}
              </Button>
              <Badge variant="secondary">
                {filteredAndSortedTransactions.length} results
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("date")}
                    className="flex items-center gap-1 h-auto p-0 font-medium"
                  >
                    Date
                    {getSortIcon("date")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("name")}
                    className="flex items-center gap-1 h-auto p-0 font-medium"
                  >
                    Name
                    {getSortIcon("name")}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("amount")}
                    className="flex items-center gap-1 h-auto p-0 font-medium ml-auto"
                  >
                    Amount
                    {getSortIcon("amount")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("category")}
                    className="flex items-center gap-1 h-auto p-0 font-medium"
                  >
                    Category
                    {getSortIcon("category")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("subcategory")}
                    className="flex items-center gap-1 h-auto p-0 font-medium"
                  >
                    Subcategory
                    {getSortIcon("subcategory")}
                  </Button>
                </TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? "No transactions match your search" : "No transactions found"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedTransactions.map((transaction) => (
                  <TransactionTableRow
                    categories={categories ?? []}
                    key={transaction.id}
                    transaction={transaction}
                    propsOnChange={handleTransactionChange}
                    propsOnDelete={() => handleTransactionDelete(transaction.id)}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Enhanced Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-muted-foreground text-sm">
            Showing {filteredAndSortedTransactions.length} of {transactionsData.total} transactions
          </div>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => {
              setPageSize(Number(value));
              setPage(1);
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
