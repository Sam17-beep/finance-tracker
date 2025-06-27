"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import { api } from "@/trpc/react";
import { toast } from "sonner";

interface BankFormProps {
  bankId?: string | null;
  onClose: () => void;
}

const DATE_FORMATS = [
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "DD-MM-YYYY", label: "DD-MM-YYYY" },
  { value: "MM-DD-YYYY", label: "MM-DD-YYYY" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "YYYYMMDD", label: "YYYYMMDD" },
  { value: "YYYY/MM/DD", label: "YYYY/MM/DD" },
];

export function BankForm({ bankId, onClose }: BankFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    dateFormat: "YYYY-MM-DD",
    dateColumnIndex: 0,
    nameColumnIndex: 1,
    amountColumnIndex: 2,
    hasSeparateIncomeExpenseColumns: false,
    incomeColumnIndex: 3,
    expenseColumnIndex: 4,
    skipFirstRow: true,
    amountIsNegative: false,
    isCreditCard: false,
  });

  const utils = api.useUtils();
  const { data: existingBank } = api.bank.getById.useQuery(bankId!, {
    enabled: !!bankId,
  });

  const createBank = api.bank.create.useMutation({
    onSuccess: () => {
      void utils.bank.getAll.invalidate();
      toast.success("Bank configuration created");
      onClose();
    },
    onError: (error) => {
      toast.error("Failed to create bank", {
        description: error.message,
      });
    },
  });

  const updateBank = api.bank.update.useMutation({
    onSuccess: () => {
      void utils.bank.getAll.invalidate();
      toast.success("Bank configuration updated");
      onClose();
    },
    onError: (error) => {
      toast.error("Failed to update bank", {
        description: error.message,
      });
    },
  });

  useEffect(() => {
    if (existingBank) {
      setFormData({
        name: existingBank.name,
        description: existingBank.description || "",
        dateFormat: existingBank.dateFormat,
        dateColumnIndex: existingBank.dateColumnIndex,
        nameColumnIndex: existingBank.nameColumnIndex,
        amountColumnIndex: existingBank.amountColumnIndex,
        hasSeparateIncomeExpenseColumns: existingBank.hasSeparateIncomeExpenseColumns,
        incomeColumnIndex: existingBank.incomeColumnIndex || 3,
        expenseColumnIndex: existingBank.expenseColumnIndex || 4,
        skipFirstRow: existingBank.skipFirstRow,
        amountIsNegative: existingBank.amountIsNegative,
        isCreditCard: existingBank.isCreditCard,
      });
    }
  }, [existingBank]);

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error("Bank name is required");
      return;
    }

    const submitData = {
      ...formData,
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      incomeColumnIndex: formData.hasSeparateIncomeExpenseColumns ? formData.incomeColumnIndex : undefined,
      expenseColumnIndex: formData.hasSeparateIncomeExpenseColumns ? formData.expenseColumnIndex : undefined,
    };

    if (bankId) {
      updateBank.mutate({ id: bankId, data: submitData });
    } else {
      createBank.mutate(submitData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {bankId ? "Edit Bank Configuration" : "Add Bank Configuration"}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Bank Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Chase Bank, Wells Fargo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateFormat">Date Format *</Label>
              <Select
                value={formData.dateFormat}
                onValueChange={(value) => setFormData(prev => ({ ...prev, dateFormat: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select date format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="DD-MM-YYYY">DD-MM-YYYY</SelectItem>
                  <SelectItem value="MM-DD-YYYY">MM-DD-YYYY</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="YYYYMMDD">YYYYMMDD</SelectItem>
                  <SelectItem value="YYYY/MM/DD">YYYY/MM/DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Optional description for this bank configuration"
              rows={2}
            />
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Column Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateColumn">Date Column Index</Label>
                <Input
                  id="dateColumn"
                  type="number"
                  min="0"
                  value={formData.dateColumnIndex}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, dateColumnIndex: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameColumn">Name Column Index</Label>
                <Input
                  id="nameColumn"
                  type="number"
                  min="0"
                  value={formData.nameColumnIndex}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, nameColumnIndex: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amountColumn">Amount Column Index</Label>
                <Input
                  id="amountColumn"
                  type="number"
                  min="0"
                  value={formData.amountColumnIndex}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, amountColumnIndex: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="separateColumns"
                checked={formData.hasSeparateIncomeExpenseColumns}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasSeparateIncomeExpenseColumns: checked }))}
              />
              <Label htmlFor="separateColumns">Separate Income/Expense Columns</Label>
            </div>

            {formData.hasSeparateIncomeExpenseColumns && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="incomeColumn">Income Column Index</Label>
                  <Input
                    id="incomeColumn"
                    type="number"
                    min="0"
                    value={formData.incomeColumnIndex}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, incomeColumnIndex: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expenseColumn">Expense Column Index</Label>
                  <Input
                    id="expenseColumn"
                    type="number"
                    min="0"
                    value={formData.expenseColumnIndex}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, expenseColumnIndex: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Account Type</h3>
            <div className="flex items-center space-x-2">
              <Switch
                id="isCreditCard"
                checked={formData.isCreditCard}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isCreditCard: checked }))}
              />
              <Label htmlFor="isCreditCard" className="text-sm">
                Credit Card Account
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              For credit cards: positive amounts are expenses (charges), negative amounts are income (payments/refunds)
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Parsing Options</h3>
            <div className="flex items-center space-x-2">
              <Switch
                id="skipFirstRow"
                checked={formData.skipFirstRow}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, skipFirstRow: checked }))}
              />
              <Label htmlFor="skipFirstRow">Skip First Row (Header)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="amountIsNegative"
                checked={formData.amountIsNegative}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, amountIsNegative: checked }))}
              />
              <Label htmlFor="amountIsNegative">Negative Amounts are Expenses</Label>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createBank.isPending || updateBank.isPending}
            >
              {bankId ? "Update" : "Create"} Bank
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 