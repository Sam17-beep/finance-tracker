"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { type CategoryFormData } from "./types";
import { api } from "@/trpc/react";
import { toast } from "sonner";

export function CategoryForm() {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    isIncome: false,
  });

  const utils = api.useUtils();
  const createCategory = api.budget.createCategory.useMutation({
    onSuccess: () => {
      setFormData({ name: "", isIncome: false });
      void utils.budget.getCategories.invalidate();
      toast.success("Category created successfully");
    },
    onError: (error) => {
      toast.error("Error creating category", {
        description: error.message,
      });
    },
  });

  const handleSubmit = () => {
    if (formData.name.trim() === "") return;

    createCategory.mutate({
      name: formData.name.trim(),
      isIncome: formData.isIncome,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Category</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category-name">Category Name</Label>
              <Input
                id="category-name"
                placeholder="e.g., Housing, Transportation"
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
            </div>
            <div className="flex items-end space-x-2">
              <div className="space-y-2">
                <Label htmlFor="is-income">Income Category</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is-income"
                    checked={formData.isIncome}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, isIncome: checked }))
                    }
                  />
                  <span>{formData.isIncome ? "Income" : "Expense"}</span>
                </div>
              </div>
              <Button
                onClick={handleSubmit}
                className="ml-auto"
                disabled={createCategory.isLoading}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
