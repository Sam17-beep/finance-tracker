"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import Papa from "papaparse";

interface CSVUploaderProps {
  onTransactionsLoaded: (
    transactions: Array<{
      date: Date;
      name: string;
      amount: number;
      categoryId?: string;
      subcategoryId?: string;
      isDiscarded: boolean;
    }>,
  ) => void;
  transactions: Array<{
    date: Date;
    name: string;
    amount: number;
    categoryId?: string;
    subcategoryId?: string;
    isDiscarded: boolean;
  }>;
}

type ColumnMapping = {
  date?: string;
  name?: string;
  expenseAmount?: string;
  incomeAmount?: string;
};

export function CSVUploader({
  onTransactionsLoaded,
  transactions,
}: CSVUploaderProps) {
  const [csvData, setCSVData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [isMapping, setIsMapping] = useState(false);

  const handleFileContent = (content: string) => {
    // Detect delimiter by analyzing first line
    const lines = content.split("\n");
    if (!lines.length) {
      toast.error("Empty file");
      return;
    }

    const firstLine = lines[0] ?? "";
    const possibleDelimiters = [",", ";", "\t", "|"] as const;
    const delimiter =
      possibleDelimiters.find((d) => firstLine.includes(d)) ?? ",";

    // Use Papa Parse for robust CSV parsing
    Papa.parse(content, {
      delimiter,
      skipEmptyLines: true,
      complete: (results: Papa.ParseResult<string[]>) => {
        if (!results.data || results.data.length < 2) {
          toast.error("File is empty or has no data");
          return;
        }

        const headers = results.data[0]?.map((h) => h.trim()) ?? [];
        if (headers.length === 0) {
          toast.error("No headers found in file");
          return;
        }

        const data = results.data
          .slice(1)
          .filter(
            (row) =>
              row.length === headers.length &&
              row.some((cell) => cell.trim() !== ""),
          );

        if (data.length === 0) {
          toast.error("No valid data rows found");
          return;
        }

        // Auto-map common column names
        const columnMapping: ColumnMapping = {};

        // Common date column names
        const dateColumns = ["date", "date de transaction", "transaction date"];
        const dateColumn = headers.find((h) =>
          dateColumns.includes(h.toLowerCase()),
        );
        if (dateColumn) columnMapping.date = dateColumn;

        // Common name/description column names
        const nameColumns = [
          "description",
          "name",
          "transaction",
          "details",
          "libellé",
        ];
        const nameColumn = headers.find((h) =>
          nameColumns.includes(h.toLowerCase()),
        );
        if (nameColumn) columnMapping.name = nameColumn;

        // Common expense/debit column names
        const expenseColumns = [
          "debit",
          "débit",
          "expense",
          "depense",
          "sortie",
        ];
        const expenseColumn = headers.find((h) =>
          expenseColumns.includes(h.toLowerCase()),
        );
        if (expenseColumn) columnMapping.expenseAmount = expenseColumn;

        // Common income/credit column names
        const incomeColumns = [
          "credit",
          "crédit",
          "income",
          "revenu",
          "entree",
        ];
        const incomeColumn = headers.find((h) =>
          incomeColumns.includes(h.toLowerCase()),
        );
        if (incomeColumn) columnMapping.incomeAmount = incomeColumn;

        setHeaders(headers);
        setCSVData(data);
        setColumnMapping(columnMapping);
        setIsMapping(true);
      },
      error: (error: Error) => {
        toast.error("Error parsing CSV: " + error.message);
      },
    });
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text !== "string") {
        toast.error("Failed to read file");
        return;
      }
      handleFileContent(text);
    };
    reader.readAsText(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
    },
    multiple: false,
  });

  const handleMappingComplete = () => {
    if (
      !columnMapping.date ||
      !columnMapping.name ||
      (!columnMapping.expenseAmount && !columnMapping.incomeAmount)
    ) {
      toast.error("Please map all required columns");
      return;
    }

    const dateColumn = columnMapping.date;
    const nameColumn = columnMapping.name;
    const expenseColumn = columnMapping.expenseAmount;
    const incomeColumn = columnMapping.incomeAmount;

    if (!dateColumn || !nameColumn) {
      toast.error("Required column mappings are missing");
      return;
    }

    const dateIndex = headers.indexOf(dateColumn);
    const nameIndex = headers.indexOf(nameColumn);
    const expenseIndex = expenseColumn ? headers.indexOf(expenseColumn) : -1;
    const incomeIndex = incomeColumn ? headers.indexOf(incomeColumn) : -1;

    // Ensure all required indices are valid
    if (dateIndex === -1 || nameIndex === -1) {
      toast.error("Invalid column mapping");
      return;
    }

    const newTransactions = csvData
      .map((row) => {
        const dateStr = row[dateIndex];
        const name = row[nameIndex];

        if (!dateStr || !name) {
          toast.error("Missing required data in row");
          return null;
        }

        // Parse date in YYYY-MM-DD format
        const dateParts = dateStr.split("-");
        if (dateParts.length !== 3) {
          toast.error(`Invalid date format in row: ${dateStr}`);
          return null;
        }

        const [yearStr, monthStr, dayStr] = dateParts;
        if (!yearStr || !monthStr || !dayStr) {
          toast.error(`Invalid date format in row: ${dateStr}`);
          return null;
        }
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10);
        const day = parseInt(dayStr, 10);

        if (isNaN(year) || isNaN(month) || isNaN(day)) {
          toast.error(`Invalid date values in row: ${dateStr}`);
          return null;
        }

        const date = new Date(year, month - 1, day); // month is 0-based in JavaScript Date

        // Validate date
        if (isNaN(date.getTime())) {
          toast.error(`Invalid date in row: ${dateStr}`);
          return null;
        }

        const expenseAmount =
          expenseIndex >= 0 ? parseFloat(row[expenseIndex] ?? "0") || 0 : 0;
        const incomeAmount =
          incomeIndex >= 0 ? parseFloat(row[incomeIndex] ?? "0") || 0 : 0;
        // Keep income positive and expenses negative
        const amount = incomeAmount - expenseAmount;

        return {
          date,
          name,
          amount,
          isDiscarded: false,
        };
      })
      .filter(
        (transaction): transaction is NonNullable<typeof transaction> =>
          transaction !== null,
      );

    if (newTransactions.length === 0) {
      toast.error("No valid transactions found in the CSV");
      return;
    }

    onTransactionsLoaded(newTransactions);
    setIsMapping(false);
    setCSVData([]);
    setHeaders([]);
    setColumnMapping({});
  };

  if (transactions.length > 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              {transactions.length} transactions loaded
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onTransactionsLoaded([])}
            >
              <X className="mr-2 h-4 w-4" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isMapping) {
    return (
      <Card>
        <CardContent className="space-y-4 p-6">
          <h3 className="font-semibold">Map CSV Columns</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Column</label>
              <Select
                value={columnMapping.date}
                onValueChange={(value) =>
                  setColumnMapping({ ...columnMapping, date: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select date column" />
                </SelectTrigger>
                <SelectContent>
                  {headers.map((header) => (
                    <SelectItem key={header} value={header}>
                      {header}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Name Column</label>
              <Select
                value={columnMapping.name}
                onValueChange={(value) =>
                  setColumnMapping({ ...columnMapping, name: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select name column" />
                </SelectTrigger>
                <SelectContent>
                  {headers.map((header) => (
                    <SelectItem key={header} value={header}>
                      {header}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Expense Amount Column
              </label>
              <Select
                value={columnMapping.expenseAmount}
                onValueChange={(value) =>
                  setColumnMapping({ ...columnMapping, expenseAmount: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select expense column" />
                </SelectTrigger>
                <SelectContent>
                  {headers.map((header) => (
                    <SelectItem key={header} value={header}>
                      {header}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Income Amount Column
              </label>
              <Select
                value={columnMapping.incomeAmount}
                onValueChange={(value) =>
                  setColumnMapping({ ...columnMapping, incomeAmount: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select income column" />
                </SelectTrigger>
                <SelectContent>
                  {headers.map((header) => (
                    <SelectItem key={header} value={header}>
                      {header}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsMapping(false);
                setCSVData([]);
                setHeaders([]);
                setColumnMapping({});
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleMappingComplete}>Import Data</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div
          {...getRootProps()}
          className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"}`}
        >
          <input {...getInputProps()} />
          <Upload className="text-muted-foreground mx-auto h-12 w-12" />
          <p className="text-muted-foreground mt-2 text-sm">
            Drag and drop your CSV file here, or click to select
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            Only .csv files are supported
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
