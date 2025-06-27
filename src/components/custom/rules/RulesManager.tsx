"use client";

import { useState, useMemo } from "react";
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
import { Plus, Pencil, Trash2, AlertTriangle, TrendingUp, Target, BarChart3, Filter } from "lucide-react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { type RouterOutputs } from "@/trpc/shared";
import { RuleDialog } from "../rules/RuleDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Rule = RouterOutputs["rules"]["getAll"][number];

interface RulesManagerProps {
  rules: Rule[];
  onRuleChangeOrCreate?: () => void;
}

export function RulesManager({
  rules: initialRules,
  onRuleChangeOrCreate: onRuleChangeOrCreate,
}: RulesManagerProps) {
  const [activeTab, setActiveTab] = useState("rules");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"usage" | "name" | "category" | "created">("usage");
  
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

  // Enhanced rule analysis
  const ruleAnalysis = useMemo(() => {
    if (!initialRules.length) return null;

    // Calculate usage statistics
    const totalTransactions = initialRules.reduce((sum, rule) => sum + rule.appliedTransactions.length, 0);
    const avgUsage = totalTransactions / initialRules.length;
    
    // Find most used rules
    const mostUsedRules = [...initialRules]
      .sort((a, b) => b.appliedTransactions.length - a.appliedTransactions.length)
      .slice(0, 5);

    // Find overlapping rules (rules that could match the same transactions)
    const overlappingRules: Array<{
      rule1: Rule;
      rule2: Rule;
      overlapType: "exact" | "contains" | "partial";
      description: string;
    }> = [];

    for (let i = 0; i < initialRules.length; i++) {
      for (let j = i + 1; j < initialRules.length; j++) {
        const rule1 = initialRules[i];
        const rule2 = initialRules[j];
        
        if (!rule1 || !rule2) continue;
        
        // Check for exact string overlaps
        if (rule1.matchString === rule2.matchString) {
          overlappingRules.push({
            rule1,
            rule2,
            overlapType: "exact",
            description: "Exact same match string"
          });
        }
        // Check for contains overlaps
        else if (rule1.matchType === "contains" && rule2.matchType === "contains") {
          if (rule1.matchString.toLowerCase().includes(rule2.matchString.toLowerCase()) ||
              rule2.matchString.toLowerCase().includes(rule1.matchString.toLowerCase())) {
            overlappingRules.push({
              rule1,
              rule2,
              overlapType: "contains",
              description: "One rule contains the other"
            });
          }
        }
        // Check for partial overlaps (one exact, one contains)
        else if ((rule1.matchType === "exact" && rule2.matchType === "contains" && 
                  rule2.matchString.toLowerCase().includes(rule1.matchString.toLowerCase())) ||
                 (rule2.matchType === "exact" && rule1.matchType === "contains" && 
                  rule1.matchString.toLowerCase().includes(rule2.matchString.toLowerCase()))) {
          overlappingRules.push({
            rule1,
            rule2,
            overlapType: "partial",
            description: "Exact rule contained in contains rule"
          });
        }
      }
    }

    // Find unused rules
    const unusedRules = initialRules.filter(rule => rule.appliedTransactions.length === 0);

    // Find rules with high usage
    const highUsageRules = initialRules.filter(rule => rule.appliedTransactions.length > avgUsage * 2);

    return {
      totalRules: initialRules.length,
      totalTransactions,
      avgUsage,
      mostUsedRules,
      overlappingRules,
      unusedRules,
      highUsageRules
    };
  }, [initialRules]);

  // Filter and sort rules
  const filteredAndSortedRules = useMemo(() => {
    let filtered = initialRules;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(rule =>
        rule.matchString.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rule.category?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rule.subcategory?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "usage":
          return b.appliedTransactions.length - a.appliedTransactions.length;
        case "name":
          return a.matchString.localeCompare(b.matchString);
        case "category":
          const catA = a.category?.name || "";
          const catB = b.category?.name || "";
          return catA.localeCompare(catB);
        case "created":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [initialRules, searchTerm, sortBy]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Rule Statistics */}
      {ruleAnalysis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rules</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ruleAnalysis.totalRules}</div>
              <p className="text-xs text-muted-foreground">
                {ruleAnalysis.totalTransactions} transactions affected
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Usage</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ruleAnalysis.avgUsage.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">
                transactions per rule
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overlapping Rules</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ruleAnalysis.overlappingRules.length}</div>
              <p className="text-xs text-muted-foreground">
                potential conflicts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unused Rules</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ruleAnalysis.unusedRules.length}</div>
              <p className="text-xs text-muted-foreground">
                no transactions matched
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Rules
          </TabsTrigger>
          <TabsTrigger value="overlaps" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Overlaps
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Rules Management</h2>
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

          {/* Enhanced Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative flex-1">
                  <Input
                    placeholder="Search rules by match string, category, or subcategory..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-center gap-2">
                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usage">Most Used</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="category">Category</SelectItem>
                      <SelectItem value="created">Recently Created</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Match String</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Subcategory</TableHead>
                    <TableHead className="text-center">Usage</TableHead>
                    <TableHead className="text-center">Discard</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedRules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {searchTerm ? "No rules match your search" : "No rules found"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedRules.map((rule) => (
                      <TableRow 
                        key={rule.id}
                        className={cn(
                          rule.matchType === 'exact' &&
                            "border-l-4 border-l-green-500/60 bg-green-50/50 dark:bg-green-950/40",
                          rule.matchType === 'contains' &&
                            "border-l-4 border-l-blue-500/60 bg-blue-50/50 dark:bg-blue-950/40",
                          "hover:bg-muted/50 transition-colors"
                        )}
                      >
                        <TableCell className="font-medium">{rule.matchString}</TableCell>
                        <TableCell>
                          {categories?.find((cat) => cat.id === rule.categoryId)?.name ?? "-"}
                        </TableCell>
                        <TableCell>
                          {categories
                            ?.find((cat) => cat.id === rule.categoryId)
                            ?.subcategories.find((sub) => sub.id === rule.subcategoryId)
                            ?.name ?? "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-medium">{rule.appliedTransactions.length}</span>
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
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overlaps" className="space-y-4">
          <h2 className="text-lg font-semibold">Rule Overlaps</h2>
          
          {ruleAnalysis && ruleAnalysis.overlappingRules.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Potential Conflicts ({ruleAnalysis.overlappingRules.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ruleAnalysis.overlappingRules.map((overlap, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <Badge variant="outline" className="text-xs">
                          {overlap.overlapType}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{overlap.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-white dark:bg-gray-800 rounded border">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-sm">Rule 1</p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteRuleMutation.mutate(overlap.rule1.id)}
                              className="h-6 w-6 p-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs capitalize">
                              {overlap.rule1.matchType}
                            </Badge>
                          </div>
                          <p className="text-sm">{overlap.rule1.matchString}</p>
                          <p className="text-xs text-muted-foreground">
                            {overlap.rule1.category?.name} → {overlap.rule1.subcategory?.name || "No subcategory"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {overlap.rule1.appliedTransactions.length} transactions
                          </p>
                        </div>
                        
                        <div className="p-3 bg-white dark:bg-gray-800 rounded border">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-sm">Rule 2</p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteRuleMutation.mutate(overlap.rule2.id)}
                              className="h-6 w-6 p-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs capitalize">
                              {overlap.rule2.matchType}
                            </Badge>
                          </div>
                          <p className="text-sm">{overlap.rule2.matchString}</p>
                          <p className="text-xs text-muted-foreground">
                            {overlap.rule2.category?.name} → {overlap.rule2.subcategory?.name || "No subcategory"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {overlap.rule2.appliedTransactions.length} transactions
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Overlapping Rules</h3>
                <p className="text-muted-foreground">
                  All your rules are unique and don't conflict with each other.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
