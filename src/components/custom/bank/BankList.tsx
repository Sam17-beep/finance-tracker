"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, CreditCard } from "lucide-react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { type RouterOutputs } from "@/trpc/shared";

type Bank = RouterOutputs["bank"]["getAll"][number];

interface BankListProps {
  banks: Bank[];
  onEdit: (bankId: string) => void;
}

export function BankList({ banks, onEdit }: BankListProps) {
  const utils = api.useUtils();
  
  const deleteBank = api.bank.delete.useMutation({
    onSuccess: () => {
      void utils.bank.getAll.invalidate();
      toast.success("Bank configuration deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete bank", {
        description: error.message,
      });
    },
  });

  const handleDelete = (bankId: string, bankName: string) => {
    if (confirm(`Are you sure you want to delete the bank configuration for "${bankName}"?`)) {
      deleteBank.mutate(bankId);
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {banks.map((bank) => (
        <Card key={bank.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CardTitle className="text-lg">{bank.name}</CardTitle>
                {bank.isCreditCard && (
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <CreditCard className="h-3 w-3" />
                    <span>Credit Card</span>
                  </Badge>
                )}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(bank.id)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(bank.id, bank.name)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {bank.description && (
              <p className="text-sm text-muted-foreground mb-2">{bank.description}</p>
            )}
            {bank.isCreditCard && (
              <p className="text-xs text-muted-foreground mb-2">
                Credit Card: Positive amounts = expenses, Negative amounts = income
              </p>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date Format:</span>
                <Badge variant="outline">{bank.dateFormat}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date Column:</span>
                <span>{bank.dateColumnIndex}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name Column:</span>
                <span>{bank.nameColumnIndex}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount Column:</span>
                <span>{bank.amountColumnIndex}</span>
              </div>
              {bank.hasSeparateIncomeExpenseColumns && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Income Column:</span>
                    <span>{bank.incomeColumnIndex}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expense Column:</span>
                    <span>{bank.expenseColumnIndex}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Skip Header:</span>
                <Badge variant={bank.skipFirstRow ? "default" : "secondary"}>
                  {bank.skipFirstRow ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Negative = Expense:</span>
                <Badge variant={bank.amountIsNegative ? "default" : "secondary"}>
                  {bank.amountIsNegative ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transactions Imported:</span>
                <span>{bank._count?.transactions || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 