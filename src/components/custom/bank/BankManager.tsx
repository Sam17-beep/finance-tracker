"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Settings } from "lucide-react";
import { BankList } from "./BankList";
import { BankForm } from "./BankForm";
import { api } from "@/trpc/react";

export function BankManager() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<string | null>(null);
  
  const { data: banks = [], refetch } = api.bank.getAll.useQuery();

  const handleEdit = (bankId: string) => {
    setEditingBank(bankId);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingBank(null);
    void refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {banks.length} bank{banks.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Bank
        </Button>
      </div>

      {banks.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Settings className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No banks configured</p>
              <p className="text-sm">
                Add your first bank configuration to start importing transactions
              </p>
              <Button 
                onClick={() => setIsFormOpen(true)} 
                className="mt-4"
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Bank
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <BankList banks={banks} onEdit={handleEdit} />
      )}

      {isFormOpen && (
        <BankForm 
          bankId={editingBank}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
} 