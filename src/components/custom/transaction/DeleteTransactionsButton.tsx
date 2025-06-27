"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2 } from "lucide-react";
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

export function DeleteTransactionsButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const utils = api.useUtils();

  const deleteTransactions = api.transaction.deleteAll.useMutation({
    onSuccess: (data) => {
      toast.success(`Deleted ${data.deletedCount} transactions`);
      void utils.transaction.getAll.invalidate();
      void utils.transaction.getDashboardData.invalidate();
      void utils.budget.getCategories.invalidate();
      setIsOpen(false);
    },
    onError: (error) => {
      toast.error("Failed to delete transactions", {
        description: error.message,
      });
    },
  });

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTransactions.mutateAsync();
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
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
            This will permanently delete all transactions. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete All Transactions"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 