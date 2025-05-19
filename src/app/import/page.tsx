"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { Upload, Save, RefreshCw } from "lucide-react";
import { CSVUploader } from "./components/CSVUploader";
import { TransactionTable } from "./components/TransactionTable";
import { RulesManager } from "./components/RulesManager";

export default function ImportPage() {
  const [activeTab, setActiveTab] = useState("transactions");
  const [transactions, setTransactions] = useState<
    Array<{
      date: Date;
      name: string;
      amount: number;
      categoryId?: string;
      subcategoryId?: string;
      isDiscarded: boolean;
    }>
  >([]);

  const utils = api.useUtils();
  const { data: categories } = api.budget.getCategories.useQuery();
  const { data: rules } = api.rules.getAll.useQuery();

  const bulkSaveMutation = api.transaction.bulkCreate.useMutation({
    onSuccess: () => {
      toast.success("Transactions saved successfully");
      setTransactions([]);
      void utils.transaction.getAll.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to save transactions: " + error.message);
    },
  });

  const reapplyRulesMutation = api.rules.applyRules.useMutation({
    onSuccess: (updatedTransactions) => {
      if (updatedTransactions) {
        setTransactions(updatedTransactions);
        toast.success("Rules reapplied successfully");
      }
    },
    onError: (error) => {
      toast.error("Failed to reapply rules: " + error.message);
    },
  });

  const handleBulkSave = () => {
    if (transactions.length === 0) {
      toast.error("No transactions to save");
      return;
    }

    bulkSaveMutation.mutate(transactions);
  };

  const handleReapplyRules = () => {
    if (transactions.length === 0) {
      toast.error("No transactions to process");
      return;
    }

    reapplyRulesMutation.mutate(transactions);
  };

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Import Transactions</h1>
        <div className="space-x-2">
          <Button
            variant="outline"
            onClick={handleReapplyRules}
            disabled={transactions.length === 0}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reapply Rules
          </Button>
          <Button onClick={handleBulkSave} disabled={transactions.length === 0}>
            <Save className="mr-2 h-4 w-4" />
            Save All
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="transactions">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <CSVUploader
            onTransactionsLoaded={setTransactions}
            transactions={transactions}
          />
          <TransactionTable
            transactions={transactions}
            setTransactions={setTransactions}
            categories={categories ?? []}
          />
        </TabsContent>

        <TabsContent value="rules">
          <RulesManager rules={rules ?? []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
