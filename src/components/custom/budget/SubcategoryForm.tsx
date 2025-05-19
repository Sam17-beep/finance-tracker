'use client'

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type SubcategoryFormData } from "./types";
import { api } from "@/trpc/react";
import { toast } from "sonner";

interface SubcategoryFormProps {
  categoryId: string;
}

export function SubcategoryForm({ categoryId }: SubcategoryFormProps) {
  const [formData, setFormData] = useState<SubcategoryFormData>({
    name: "",
    amount: "",
  });

  const utils = api.useUtils();
  const createSubcategory = api.budget.createSubcategory.useMutation({
    onSuccess: () => {
      setFormData({ name: "", amount: "" });
      void utils.budget.getCategories.invalidate();
      toast.success("Subcategory created successfully");
    },
    onError: (error) => {
      toast.error("Error creating subcategory", {
        description: error.message,
      });
    },
  });

  const handleSubmit = () => {
    if (formData.name.trim() === "" || isNaN(Number.parseFloat(formData.amount))) return;

    const amount = Number.parseFloat(Number.parseFloat(formData.amount).toFixed(2));
    if (amount < 0) return;

    createSubcategory.mutate({
      name: formData.name.trim(),
      targetAmount: amount,
      categoryId,
    });
  };

  return (
    <div className="mb-4 p-3 bg-muted/50 rounded-md">
      <h4 className="text-sm font-medium mb-2">Add Subcategory</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input
          placeholder="Subcategory name"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
        />
        <div className="flex space-x-2">
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="Target amount (0.00)"
            value={formData.amount}
            onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
          />
          <Button
            onClick={handleSubmit}
            disabled={createSubcategory.isLoading}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
} 