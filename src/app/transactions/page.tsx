"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { startOfMonth, endOfMonth } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RulesManager } from "@/components/custom/rules/RulesManager";

export default function TransactionPage() {
  const router = useRouter();
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [selectedCategory, setSelectedCategory] = useState<string>("any");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("any");
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // Fetch categories and subcategories for filters
  const { data: categories } = api.budget.getCategories.useQuery();

  // Fetch transactions with filters
  const { data: transactionsData, isLoading: isLoadingTransactions } =
    api.transaction.getAll.useQuery({
      dateRange,
      categoryId: selectedCategory === "any" ? undefined : selectedCategory,
      subcategoryId:
        selectedSubcategory === "any" ? undefined : selectedSubcategory,
      page,
      pageSize,
    });

  // Fetch rules
  const { data: rules, isLoading: isLoadingRules } =
    api.rules.getAll.useQuery();

  // Mutation to reapply all rules
  const reapplyRulesMutation = api.rules.reapplyAllRules.useMutation({
    onSuccess: () => {
      toast.success("Rules reapplied successfully");
      router.refresh();
    },
    onError: (error) => {
      toast.error("Failed to reapply rules: " + error.message);
    },
  });

  const handleReapplyRules = () => {
    reapplyRulesMutation.mutate();
  };

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Transactions & Rules</h1>
        <Button
          onClick={handleReapplyRules}
          disabled={reapplyRulesMutation.isPending}
        >
          {reapplyRulesMutation.isPending
            ? "Reapplying..."
            : "Reapply All Rules"}
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <DateRangePicker value={dateRange} onChange={setDateRange} />
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any Category</SelectItem>
            {categories?.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={selectedSubcategory}
          onValueChange={setSelectedSubcategory}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select subcategory" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any Subcategory</SelectItem>
            {categories
              ?.filter((cat) => cat.id === selectedCategory)
              .map((category) =>
                category.subcategories.map((subcategory) => (
                  <SelectItem key={subcategory.id} value={subcategory.id}>
                    {subcategory.name}
                  </SelectItem>
                )),
              )}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
        </TabsList>
        <TabsContent value="transactions">
          {isLoadingTransactions ? <div>Loading transactions...</div> : <div />}
        </TabsContent>
        <TabsContent value="rules">
          {isLoadingRules ? (
            <div>Loading rules...</div>
          ) : (
            <RulesManager
              rules={rules ?? []}
              onRuleChangeOrCreate={() => router.refresh()}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
