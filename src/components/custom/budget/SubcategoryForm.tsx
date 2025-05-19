"use client";

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
    if (
      formData.name.trim() === "" ||
      isNaN(Number.parseFloat(formData.amount))
    )
      return;

    const amount = Number.parseFloat(
      Number.parseFloat(formData.amount).toFixed(2),
    );
    if (amount < 0) return;

    createSubcategory.mutate({
      name: formData.name.trim(),
      targetAmount: amount,
      categoryId,
    });
  };

  return (
    <div className="bg-muted/50 mb-4 rounded-md p-3">
      <h4 className="mb-2 text-sm font-medium">Add Subcategory</h4>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Input
          placeholder="Subcategory name"
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <div className="flex space-x-2">
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="Target amount (0.00)"
            value={formData.amount}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, amount: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <Button onClick={handleSubmit} disabled={createSubcategory.isPending}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
