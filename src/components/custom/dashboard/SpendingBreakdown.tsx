"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { api } from "@/trpc/react";
import { useTimeframe } from "@/components/providers/timeframe-provider";

interface CategoryBreakdown {
  id: string;
  name: string;
  totalSpent: number;
  budgetTarget: number;
  variance: number;
  percentage: number;
  subcategories: SubcategoryBreakdown[];
  isExpanded: boolean;
}

interface SubcategoryBreakdown {
  id: string;
  name: string;
  totalSpent: number;
  budgetTarget: number;
  variance: number;
  percentage: number;
}

export function SpendingBreakdown() {
  const { getDateRange, getTimeframeLabel } = useTimeframe();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  const { data: categories } = api.budget.getCategories.useQuery();
  const { data: transactionsData } = api.transaction.getDashboardData.useQuery({
    dateRange: getDateRange(),
  });

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const processBreakdown = (): CategoryBreakdown[] => {
    if (!categories || !transactionsData?.transactions) return [];

    const totalSpending = transactionsData.transactions
      .filter(t => !t.isDiscarded && t.category && !t.category.isIncome)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return categories
      .filter(category => !category.isIncome)
      .map(category => {
        const categoryTransactions = transactionsData.transactions.filter(
          t => t.categoryId === category.id && !t.isDiscarded
        );

        const categorySpent = categoryTransactions.reduce(
          (sum, t) => sum + Math.abs(t.amount), 0
        );

        const budgetTarget = category.subcategories.reduce(
          (sum, sub) => sum + Number(sub.targetAmount), 0
        );

        const variance = budgetTarget - categorySpent;
        const percentage = totalSpending > 0 ? (categorySpent / totalSpending) * 100 : 0;

        // Process subcategories
        const subcategoryMap = new Map<string, SubcategoryBreakdown>();
        
        // Initialize subcategories with budget targets
        category.subcategories.forEach(sub => {
          subcategoryMap.set(sub.id, {
            id: sub.id,
            name: sub.name,
            totalSpent: 0,
            budgetTarget: Number(sub.targetAmount),
            variance: Number(sub.targetAmount),
            percentage: 0,
          });
        });

        // Add actual spending to subcategories
        categoryTransactions.forEach(transaction => {
          if (transaction.subcategoryId) {
            const sub = subcategoryMap.get(transaction.subcategoryId);
            if (sub) {
              sub.totalSpent += Math.abs(transaction.amount);
              sub.variance = sub.budgetTarget - sub.totalSpent;
              sub.percentage = categorySpent > 0 ? (sub.totalSpent / categorySpent) * 100 : 0;
            }
          }
        });

        return {
          id: category.id,
          name: category.name,
          totalSpent: categorySpent,
          budgetTarget,
          variance,
          percentage,
          subcategories: Array.from(subcategoryMap.values())
            .filter(sub => sub.totalSpent > 0 || sub.budgetTarget > 0)
            .sort((a, b) => b.totalSpent - a.totalSpent),
          isExpanded: expandedCategories.has(category.id),
        };
      })
      .filter(category => category.totalSpent > 0 || category.budgetTarget > 0)
      .sort((a, b) => b.totalSpent - a.totalSpent);
  };

  const breakdown = processBreakdown();
  const totalSpending = breakdown.reduce((sum, cat) => sum + cat.totalSpent, 0);
  const totalBudget = breakdown.reduce((sum, cat) => sum + cat.budgetTarget, 0);
  const overallVariance = totalBudget - totalSpending;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  const getVarianceColor = (variance: number) => {
    if (variance >= 0) return "text-green-600";
    return "text-red-600";
  };

  const getVarianceIcon = (variance: number) => {
    if (variance >= 0) return <TrendingDown className="h-4 w-4" />;
    return <TrendingUp className="h-4 w-4" />;
  };

  if (breakdown.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spending Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No spending data available for {getTimeframeLabel()}</p>
            <p className="text-sm">Add transactions and categories to see your spending breakdown</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Spending Breakdown</CardTitle>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-muted-foreground">Total Spent:</span>
              <span className="font-semibold">{formatCurrency(totalSpending)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-muted-foreground">Budget:</span>
              <span className="font-semibold">{formatCurrency(totalBudget)}</span>
            </div>
            <div className={`flex items-center space-x-1 ${getVarianceColor(overallVariance)}`}>
              {getVarianceIcon(overallVariance)}
              <span className="font-semibold">{formatCurrency(Math.abs(overallVariance))}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {breakdown.map((category) => (
            <div key={category.id} className="border rounded-lg p-4">
              {/* Category Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleCategory(category.id)}
                    className="h-6 w-6 p-0"
                  >
                    {category.isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                  <div>
                    <h3 className="font-semibold">{category.name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>{formatCurrency(category.totalSpent)}</span>
                      <span>{formatPercentage(category.percentage)} of total</span>
                      <span>Budget: {formatCurrency(category.budgetTarget)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className={getVarianceColor(category.variance)}>
                    {getVarianceIcon(category.variance)}
                    <span className="ml-1">{formatCurrency(Math.abs(category.variance))}</span>
                  </Badge>
                </div>
              </div>

              {/* Subcategories */}
              {category.isExpanded && category.subcategories.length > 0 && (
                <div className="ml-8 space-y-2">
                  {category.subcategories.map((subcategory) => (
                    <div key={subcategory.id} className="flex items-center justify-between py-2 border-l-2 border-muted pl-4">
                      <div>
                        <p className="font-medium text-sm">{subcategory.name}</p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span>{formatCurrency(subcategory.totalSpent)}</span>
                          <span>{formatPercentage(subcategory.percentage)} of category</span>
                          <span>Budget: {formatCurrency(subcategory.budgetTarget)}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getVarianceColor(subcategory.variance)}`}
                        >
                          {getVarianceIcon(subcategory.variance)}
                          <span className="ml-1">{formatCurrency(Math.abs(subcategory.variance))}</span>
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Spending Progress</span>
                  <span>{formatPercentage((category.totalSpent / category.budgetTarget) * 100)}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      category.totalSpent > category.budgetTarget 
                        ? 'bg-red-500' 
                        : 'bg-green-500'
                    }`}
                    style={{ 
                      width: `${Math.min((category.totalSpent / category.budgetTarget) * 100, 100)}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 