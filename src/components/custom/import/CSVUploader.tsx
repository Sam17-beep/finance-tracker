"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, AlertCircle } from "lucide-react";
import Papa from "papaparse";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CSVUploaderProps {
  onTransactionsLoaded: (transactions: Array<{
    id?: string;
    date: Date;
    name: string;
    amount: number;
    categoryId?: string;
    subcategoryId?: string;
    isDiscarded: boolean;
    appliedRuleId?: string;
  }>) => void;
  transactions: Array<{
    id?: string;
    date: Date;
    name: string;
    amount: number;
    categoryId?: string;
    subcategoryId?: string;
    isDiscarded: boolean;
    appliedRuleId?: string;
  }>;
}

export function CSVUploader({
  onTransactionsLoaded,
  transactions,
}: CSVUploaderProps) {
  const [selectedBankId, setSelectedBankId] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { data: banks = [] } = api.bank.getAll.useQuery();
  const parseCsvMutation = api.bank.parseCsv.useMutation();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      if (!selectedBankId) {
        toast.error("Please select a bank configuration first");
        return;
      }

      const file = acceptedFiles[0];
      if (!file) return;

      setIsProcessing(true);

      try {
        const text = await file.text();
        const result = Papa.parse(text, {
          header: false,
          skipEmptyLines: true,
        });

        if (result.errors.length > 0) {
          console.error("CSV parsing errors:", result.errors);
          toast.error("Error parsing CSV file");
          return;
        }

        const csvData = result.data as string[][];
        
        if (csvData.length === 0) {
          toast.error("CSV file is empty");
          return;
        }

        // Use bank configuration to parse the CSV
        const parseResult = await parseCsvMutation.mutateAsync({
          bankId: selectedBankId,
          csvData,
        });

        if (parseResult.transactions.length === 0) {
          toast.error("No valid transactions found in the CSV");
          return;
        }

        // Convert to the expected format
        const formattedTransactions = parseResult.transactions.map((transaction) => ({
          id: undefined,
          date: transaction.date,
          name: transaction.name,
          amount: typeof transaction.amount === 'string' ? parseFloat(transaction.amount) : Number(transaction.amount),
          categoryId: undefined,
          subcategoryId: undefined,
          isDiscarded: false,
          appliedRuleId: undefined,
        }));

        onTransactionsLoaded(formattedTransactions);
        
        toast.success(
          `Successfully loaded ${formattedTransactions.length} transactions from ${parseResult.bank.name}`
        );
      } catch (error) {
        console.error("Error processing CSV:", error);
        toast.error("Failed to process CSV file");
      } finally {
        setIsProcessing(false);
      }
    },
    [selectedBankId, parseCsvMutation, onTransactionsLoaded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".csv"],
    },
    multiple: false,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Transactions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Bank Configuration</label>
          <Select value={selectedBankId} onValueChange={setSelectedBankId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a bank configuration" />
            </SelectTrigger>
            <SelectContent>
              {banks.map((bank: any) => (
                <SelectItem key={bank.id} value={bank.id}>
                  {bank.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {banks.length === 0 && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>No bank configurations found. Please add a bank configuration first.</span>
            </div>
          )}
        </div>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          {isDragActive ? (
            <p className="text-sm">Drop the CSV file here...</p>
          ) : (
            <div>
              <p className="text-sm font-medium">
                Drag and drop a CSV file here, or click to select
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports .csv files
              </p>
            </div>
          )}
        </div>

        {transactions.length > 0 && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>{transactions.length} transaction(s) loaded</span>
          </div>
        )}

        {isProcessing && (
          <div className="text-center text-sm text-muted-foreground">
            Processing CSV file...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
