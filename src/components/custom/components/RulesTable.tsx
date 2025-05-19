"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type RouterOutputs } from "@/trpc/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { Pencil, Trash2, Save, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";

type Category = RouterOutputs["budget"]["getCategories"][number];
type Rule = RouterOutputs["rules"]["getAll"][number];

interface RulesTableProps {
  rules: Rule[];
  categories: Category[];
  onRuleChange?: () => void;
}

interface EditableRule {
  id: string;
  matchType: "exact" | "contains";
  matchString: string;
  categoryId: string | null;
  subcategoryId: string | null;
  isDiscarded: boolean;
  isEditing?: boolean;
}

export function RulesTable({
  rules: initialRules,
  categories,
  onRuleChange,
}: RulesTableProps) {
  const [rules, setRules] = useState<EditableRule[]>(
    initialRules.map((rule) => ({
      id: rule.id,
      matchType: rule.matchType as "exact" | "contains",
      matchString: rule.matchString,
      categoryId: rule.categoryId,
      subcategoryId: rule.subcategoryId,
      isDiscarded: rule.isDiscarded,
      isEditing: false,
    })),
  );

  const updateRule = api.rules.update.useMutation({
    onSuccess: () => {
      toast.success("Rule updated successfully");
      onRuleChange?.();
    },
    onError: () => {
      toast.error("Failed to update rule");
    },
  });

  const deleteRule = api.rules.delete.useMutation({
    onSuccess: () => {
      toast.success("Rule deleted successfully");
      onRuleChange?.();
    },
    onError: () => {
      toast.error("Failed to delete rule");
    },
  });

  const handleEdit = (index: number) => {
    setRules(
      rules.map((rule, i) => ({
        ...rule,
        isEditing: i === index,
      })),
    );
  };

  const handleCancel = (index: number) => {
    setRules(
      rules.map((rule, i) => ({
        ...rule,
        isEditing: i === index ? false : rule.isEditing,
      })),
    );
  };

  const handleSave = async (index: number) => {
    const rule = rules[index];
    if (!rule) return;

    try {
      await updateRule.mutateAsync({
        id: rule.id,
        data: {
          matchType: rule.matchType,
          matchString: rule.matchString,
          categoryId: rule.categoryId ?? undefined,
          subcategoryId: rule.subcategoryId ?? undefined,
          isDiscarded: rule.isDiscarded,
        },
      });

      setRules(
        rules.map((r, i) => ({
          ...r,
          isEditing: i === index ? false : r.isEditing,
        })),
      );
    } catch {
      // Error is handled by the mutation's onError callback
    }
  };

  const handleDelete = async (index: number) => {
    const rule = rules[index];
    if (!rule) return;

    try {
      await deleteRule.mutateAsync(rule.id);
      setRules(rules.filter((_, i) => i !== index));
    } catch {
      // Error is handled by the mutation's onError callback
    }
  };

  const handleChange = (
    index: number,
    field: keyof EditableRule,
    value: string | boolean | null,
  ) => {
    setRules(
      rules.map((rule, i) =>
        i === index
          ? {
              ...rule,
              [field]: value,
            }
          : rule,
      ),
    );
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Match Type</TableHead>
            <TableHead>Match String</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Subcategory</TableHead>
            <TableHead className="text-center">Discarded</TableHead>
            <TableHead className="w-[150px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules.map((rule, index) => (
            <TableRow key={rule.id}>
              <td className="pl-2">
                {rule.isEditing ? (
                  <Select
                    value={rule.matchType}
                    onValueChange={(value: "exact" | "contains") =>
                      handleChange(index, "matchType", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exact">Exact</SelectItem>
                      <SelectItem value="contains">Contains</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  rule.matchType
                )}
              </td>
              <td>
                {rule.isEditing ? (
                  <Input
                    value={rule.matchString}
                    onChange={(e) =>
                      handleChange(index, "matchString", e.target.value)
                    }
                  />
                ) : (
                  rule.matchString
                )}
              </td>
              <td>
                {rule.isEditing ? (
                  <Select
                    value={rule.categoryId ?? ""}
                    onValueChange={(value) =>
                      handleChange(index, "categoryId", value || null)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  (categories.find((c) => c.id === rule.categoryId)?.name ??
                  "None")
                )}
              </td>
              <td>
                {rule.isEditing ? (
                  <Select
                    value={rule.subcategoryId ?? ""}
                    onValueChange={(value) =>
                      handleChange(index, "subcategoryId", value || null)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {categories
                        .find((c) => c.id === rule.categoryId)
                        ?.subcategories.map((subcategory) => (
                          <SelectItem
                            key={subcategory.id}
                            value={subcategory.id}
                          >
                            {subcategory.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                ) : (
                  (categories
                    .find((c) => c.id === rule.categoryId)
                    ?.subcategories.find((s) => s.id === rule.subcategoryId)
                    ?.name ?? "None")
                )}
              </td>
              <td className="text-center">
                {rule.isEditing ? (
                  <Switch
                    checked={rule.isDiscarded}
                    onCheckedChange={(checked) =>
                      handleChange(index, "isDiscarded", checked)
                    }
                  />
                ) : rule.isDiscarded ? (
                  "Yes"
                ) : (
                  "No"
                )}
              </td>
              <td>
                <div className="flex items-center gap-2">
                  {rule.isEditing ? (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSave(index)}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCancel(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(index)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </td>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
