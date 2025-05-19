"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { type RouterOutputs } from "@/trpc/shared";

type Rule = RouterOutputs["rules"]["getAll"][number];

interface RuleFormData {
  matchType: "exact" | "contains";
  matchString: string;
  categoryId: string | undefined;
  subcategoryId: string | undefined;
  isDiscarded: boolean;
}

interface RuleDialogProps {
  trigger: ReactNode;
  editingRule?: Rule | null;
  initialMatchString?: string;
  initialCategoryId?: string;
  initialSubcategoryId?: string;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export function RuleDialog({
  trigger,
  editingRule,
  initialMatchString,
  initialCategoryId,
  initialSubcategoryId,
  onOpenChange,
  onSuccess,
}: RuleDialogProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<RuleFormData>({
    matchType: "exact",
    matchString: initialMatchString ?? "",
    categoryId: initialCategoryId ?? undefined,
    subcategoryId: initialSubcategoryId ?? undefined,
    isDiscarded: false,
  });

  const utils = api.useUtils();
  const { data: categories } = api.budget.getCategories.useQuery();

  const createRuleMutation = api.rules.create.useMutation({
    onSuccess: () => {
      void utils.rules.getAll.invalidate();
      setIsDialogOpen(false);
      resetForm();
      toast.success("Rule created successfully");
      onSuccess?.();
    },
    onError: (error) => {
      toast.error("Failed to create rule: " + error.message);
    },
  });

  const updateRuleMutation = api.rules.update.useMutation({
    onSuccess: () => {
      void utils.rules.getAll.invalidate();
      setIsDialogOpen(false);
      resetForm();
      toast.success("Rule updated successfully");
      onSuccess?.();
    },
    onError: (error) => {
      toast.error("Failed to update rule: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      matchType: "contains",
      matchString: initialMatchString ?? "",
      categoryId: undefined,
      subcategoryId: undefined,
      isDiscarded: false,
    });
  };

  // Update form when editingRule or initialMatchString changes
  useState(() => {
    if (editingRule) {
      setFormData({
        matchType: editingRule.matchType as "exact" | "contains",
        matchString: editingRule.matchString,
        categoryId: editingRule.categoryId ?? undefined,
        subcategoryId: editingRule.subcategoryId ?? undefined,
        isDiscarded: editingRule.isDiscarded,
      });
    } else if (initialMatchString) {
      setFormData((prev) => ({ ...prev, matchString: initialMatchString }));
    }
  });

  const handleSubmit = () => {
    if (!formData.matchString) {
      toast.error("Match string is required");
      return;
    }

    if (editingRule) {
      updateRuleMutation.mutate({
        id: editingRule.id,
        data: formData,
      });
    } else {
      createRuleMutation.mutate(formData);
    }
  };

  const selectedCategory = categories?.find(
    (cat) => cat.id === formData.categoryId,
  );

  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        setIsDialogOpen(open);
        onOpenChange?.(open);
        if (!open) {
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingRule ? "Edit Rule" : "Create Rule"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Match Type</label>
            <Select
              value={formData.matchType}
              onValueChange={(value: "exact" | "contains") =>
                setFormData({ ...formData, matchType: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="exact">Exact Match</SelectItem>
                <SelectItem value="contains">Contains</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Match String</label>
            <Input
              value={formData.matchString}
              onChange={(e) =>
                setFormData({ ...formData, matchString: e.target.value })
              }
              placeholder="Enter text to match"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select
              value={formData.categoryId}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  categoryId: value,
                  subcategoryId: "",
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Subcategory</label>
            <Select
              value={formData.subcategoryId}
              onValueChange={(value) =>
                setFormData({ ...formData, subcategoryId: value })
              }
              disabled={!formData.categoryId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select subcategory" />
              </SelectTrigger>
              <SelectContent>
                {selectedCategory?.subcategories.map((sub) => (
                  <SelectItem key={sub.id} value={sub.id}>
                    {sub.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.isDiscarded}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isDiscarded: checked })
              }
            />
            <label className="text-sm font-medium">Discard Transaction</label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingRule ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
