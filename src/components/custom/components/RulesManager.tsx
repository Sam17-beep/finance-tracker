"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { type RouterOutputs } from "@/trpc/shared";
import { RuleDialog } from "./RuleDialog";

type Rule = RouterOutputs["rules"]["getAll"][number];

interface RulesManagerProps {
  rules: Rule[];
  onRuleCreated?: () => void;
}

export function RulesManager({
  rules: initialRules,
  onRuleCreated: onRuleChangeOrCreate,
}: RulesManagerProps) {
  const utils = api.useUtils();
  const { data: categories } = api.budget.getCategories.useQuery();

  const deleteRuleMutation = api.rules.delete.useMutation({
    onSuccess: () => {
      void utils.rules.getAll.invalidate();
      toast.success("Rule deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete rule: " + error.message);
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Rules</h2>
        <RuleDialog
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Rule
            </Button>
          }
          onSuccess={onRuleChangeOrCreate}
        />
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
                  {categories
                    ?.find((cat) => cat.id === rule.categoryId)
                    ?.subcategories.find((sub) => sub.id === rule.subcategoryId)
                    ?.name ?? "-"}
                </TableCell>
                <TableCell className="text-center">
                  <Switch checked={rule.isDiscarded} disabled />
                </TableCell>
                <TableCell>
                  <div className="flex justify-end space-x-2">
                    <RuleDialog
                      trigger={
                        <Button size="sm" variant="outline">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      }
                      editingRule={rule}
                      onSuccess={onRuleChangeOrCreate}
                    />
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
