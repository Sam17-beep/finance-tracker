"use client";

import { useState } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { type RouterOutputs } from "@/trpc/shared";

type Rule = RouterOutputs["rules"]["getAll"][number];

interface RulesManagerProps {
  rules: Rule[];
}

interface RuleFormData {
  matchType: "exact" | "contains";
  matchString: string;
  categoryId: string | undefined;
  subcategoryId: string | undefined;
  isDiscarded: boolean;
}

export function RulesManager({ rules: initialRules }: RulesManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [formData, setFormData] = useState<RuleFormData>({
    matchType: "contains",
    matchString: "",
    categoryId: undefined,
    subcategoryId: undefined,
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
    },
    onError: (error) => {
      toast.error("Failed to update rule: " + error.message);
    },
  });

  const deleteRuleMutation = api.rules.delete.useMutation({
    onSuccess: () => {
      void utils.rules.getAll.invalidate();
      toast.success("Rule deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete rule: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      matchType: "contains",
      matchString: "",
      categoryId: undefined,
      subcategoryId: undefined,
      isDiscarded: false,
    });
    setEditingRule(null);
  };

  const handleOpenDialog = (rule?: Rule) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        matchType: rule.matchType as "exact" | "contains",
        matchString: rule.matchString,
        categoryId: rule.categoryId ?? undefined,
        subcategoryId: rule.subcategoryId ?? undefined,
        isDiscarded: rule.isDiscarded,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Rules</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              New Rule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingRule ? "Edit Rule" : "Create Rule"}
              </DialogTitle>
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
                <label className="text-sm font-medium">
                  Discard Transaction
                </label>
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
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Match Type</TableHead>
              <TableHead>Match String</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Subcategory</TableHead>
              <TableHead className="text-center">Discard</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialRules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell className="capitalize">{rule.matchType}</TableCell>
                <TableCell>{rule.matchString}</TableCell>
                <TableCell>
                  {categories?.find((cat) => cat.id === rule.categoryId)
                    ?.name ?? "-"}
                </TableCell>
                <TableCell>
                  {selectedCategory?.subcategories.find(
                    (sub) => sub.id === rule.subcategoryId,
                  )?.name ?? "-"}
                </TableCell>
                <TableCell className="text-center">
                  <Switch checked={rule.isDiscarded} disabled />
                </TableCell>
                <TableCell>
                  <div className="flex justify-end space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenDialog(rule)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteRuleMutation.mutate(rule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
