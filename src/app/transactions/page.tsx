"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/trpc/react";
import { RulesManager } from "@/components/custom/rules/RulesManager";
import { TransactionTable } from "@/components/custom/transaction/TransactionTable";
import { ReapplyRulesButton } from "@/components/custom/rules/ReapplyRulesButton";
import DateSelectorHeader from "@/components/custom/filter/DateSelectorHeader";
import { CategoryFilter } from "@/components/custom/filter/CategoryFilter";

export default function TransactionPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("any");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("any");

  const { data: rules, isLoading: isLoadingRules } = api.rules.getAll.useQuery({
    categoryId: selectedCategory === "any" ? undefined : selectedCategory,
    subcategoryId:
      selectedSubcategory === "any" ? undefined : selectedSubcategory,
  });

  return (
    <main className="container mx-auto py-6">
      <Tabs defaultValue="transactions">
        <div className="mb-4 flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
          </TabsList>
          <ReapplyRulesButton />
        </div>
        <div className="flex flex-col gap-4">
          <DateSelectorHeader>
            <CategoryFilter
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectedSubcategory={selectedSubcategory}
              setSelectedSubcategory={setSelectedSubcategory}
            />
          </DateSelectorHeader>
        </div>
        <TabsContent value="transactions" className="mt-4">
          <TransactionTable
            selectedCategory={selectedCategory}
            selectedSubcategory={selectedSubcategory}
          />
        </TabsContent>
        <TabsContent value="rules" className="mt-4">
          {isLoadingRules && <p>Loading rules...</p>}
          {rules && <RulesManager rules={rules} />}
        </TabsContent>
      </Tabs>
    </main>
  );
}
