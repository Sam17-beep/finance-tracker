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

export function DeleteBudgetButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const utils = api.useUtils();

  const deleteBudget = api.budget.deleteAll.useMutation({
    onSuccess: (data) => {
      toast.success(`Deleted ${data.deletedCategories} categories and ${data.deletedSubcategories} subcategories`);
      void utils.budget.getCategories.invalidate();
      void utils.transaction.getAll.invalidate();
      void utils.transaction.getDashboardData.invalidate();
      setIsOpen(false);
    },
    onError: (error) => {
      toast.error("Failed to delete budget data", {
        description: error.message,
      });
    },
  });

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteBudget.mutateAsync();
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
            This will permanently delete all budget categories and subcategories. This action cannot be undone.
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
            {isDeleting ? "Deleting..." : "Delete All Budget Categories"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 