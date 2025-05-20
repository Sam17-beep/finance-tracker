"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/trpc/react";
import { RulesManager } from "@/components/custom/rules/RulesManager";
import { TransactionTable } from "@/components/custom/transaction/TransactionTable";
import { ReapplyRulesButton } from "@/components/custom/rules/ReapplyRulesButton";
import { TransactionFilter } from "@/components/custom/transaction/TransactionFilter";
import { endOfYear, startOfYear } from "date-fns";
import { type DateRange } from "@/components/ui/DateRangePicker";

export default function TransactionPage() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfYear(new Date()),
    to: endOfYear(new Date()),
  });
  const [selectedCategory, setSelectedCategory] = useState<string>("any");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("any");

  const { data: rules, isLoading: isLoadingRules } = api.rules.getAll.useQuery({
    categoryId: selectedCategory === "any" ? undefined : selectedCategory,
    subcategoryId:
      selectedSubcategory === "any" ? undefined : selectedSubcategory,
  });

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Transactions & Rules</h1>
        <ReapplyRulesButton />
      </div>
      <TransactionFilter
        dateRange={dateRange}
        setDateRange={setDateRange}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedSubcategory={selectedSubcategory}
        setSelectedSubcategory={setSelectedSubcategory}
      />
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
        </TabsList>
        <TabsContent value="transactions">
          <TransactionTable
            dateRange={dateRange}
            selectedCategory={selectedCategory}
            selectedSubcategory={selectedSubcategory}
          />
        </TabsContent>
        <TabsContent value="rules">
          {isLoadingRules ? (
            <div>Loading rules...</div>
          ) : (
            <RulesManager
              rules={rules ?? []}
              onRuleChangeOrCreate={() =>
                api.useUtils().transaction.getAll.invalidate()
              }
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
