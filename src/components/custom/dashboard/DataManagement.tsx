"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2, Database } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { api } from "@/trpc/react";
import { toast } from "sonner";

export function DataManagement() {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<"transactions" | "budget" | "all" | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const utils = api.useUtils();

  const deleteTransactions = api.transaction.deleteAll.useMutation({
    onSuccess: (data) => {
      toast.success(`Deleted ${data.deletedCount} transactions`);
      void utils.transaction.getAll.invalidate();
      void utils.transaction.getDashboardData.invalidate();
      void utils.budget.getCategories.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to delete transactions", {
        description: error.message,
      });
    },
  });

  const deleteBudget = api.budget.deleteAll.useMutation({
    onSuccess: (data) => {
      toast.success(`Deleted ${data.deletedCategories} categories and ${data.deletedSubcategories} subcategories`);
      void utils.budget.getCategories.invalidate();
      void utils.transaction.getAll.invalidate();
      void utils.transaction.getDashboardData.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to delete budget data", {
        description: error.message,
      });
    },
  });

  const handleDelete = async () => {
    if (!deleteType) return;

    setIsDeleting(true);
    try {
      if (deleteType === "transactions" || deleteType === "all") {
        await deleteTransactions.mutateAsync();
      }
      
      if (deleteType === "budget" || deleteType === "all") {
        await deleteBudget.mutateAsync();
      }
      
      setIsDeleteDialogOpen(false);
      setDeleteType(null);
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getDeleteDescription = () => {
    switch (deleteType) {
      case "transactions":
        return "This will permanently delete all transactions. This action cannot be undone.";
      case "budget":
        return "This will permanently delete all budget categories and subcategories. This action cannot be undone.";
      case "all":
        return "This will permanently delete all transactions, budget categories, and subcategories. This action cannot be undone.";
      default:
        return "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Data Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="justify-start text-destructive hover:text-destructive"
                onClick={() => setDeleteType("transactions")}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete All Transactions
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Delete All Transactions
                </DialogTitle>
                <DialogDescription>
                  {getDeleteDescription()}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete Transactions"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="justify-start text-destructive hover:text-destructive"
                onClick={() => setDeleteType("budget")}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete All Budget Categories
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Delete All Budget Categories
                </DialogTitle>
                <DialogDescription>
                  {getDeleteDescription()}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete Budget Categories"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="destructive"
                className="justify-start"
                onClick={() => setDeleteType("all")}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete All Data
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Delete All Data
                </DialogTitle>
                <DialogDescription>
                  {getDeleteDescription()}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete All Data"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
} 