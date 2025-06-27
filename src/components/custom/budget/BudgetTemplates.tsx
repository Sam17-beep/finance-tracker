"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Home, 
  Car, 
  GraduationCap, 
  Heart, 
  Plus,
  Check
} from "lucide-react";
import { api } from "@/trpc/react";
import { toast } from "sonner";

interface BudgetTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  categories: Array<{
    name: string;
    isIncome: boolean;
    subcategories: Array<{
      name: string;
      targetAmount: number;
    }>;
  }>;
}

const BUDGET_TEMPLATES: BudgetTemplate[] = [
  {
    id: "50-30-20",
    name: "50/30/20 Rule",
    description: "Classic budgeting method: 50% needs, 30% wants, 20% savings",
    icon: <FileText className="h-4 w-4" />,
    categories: [
      {
        name: "Needs (50%)",
        isIncome: false,
        subcategories: [
          { name: "Housing", targetAmount: 0 },
          { name: "Utilities", targetAmount: 0 },
          { name: "Food", targetAmount: 0 },
          { name: "Transportation", targetAmount: 0 },
          { name: "Insurance", targetAmount: 0 },
        ],
      },
      {
        name: "Wants (30%)",
        isIncome: false,
        subcategories: [
          { name: "Entertainment", targetAmount: 0 },
          { name: "Shopping", targetAmount: 0 },
          { name: "Dining Out", targetAmount: 0 },
          { name: "Hobbies", targetAmount: 0 },
        ],
      },
      {
        name: "Savings (20%)",
        isIncome: false,
        subcategories: [
          { name: "Emergency Fund", targetAmount: 0 },
          { name: "Retirement", targetAmount: 0 },
          { name: "Investments", targetAmount: 0 },
        ],
      },
    ],
  },
  {
    id: "student",
    name: "Student Budget",
    description: "Budget template for students managing limited income",
    icon: <GraduationCap className="h-4 w-4" />,
    categories: [
      {
        name: "Income",
        isIncome: true,
        subcategories: [
          { name: "Part-time Job", targetAmount: 0 },
          { name: "Scholarships", targetAmount: 0 },
          { name: "Parental Support", targetAmount: 0 },
        ],
      },
      {
        name: "Education",
        isIncome: false,
        subcategories: [
          { name: "Tuition", targetAmount: 0 },
          { name: "Books & Supplies", targetAmount: 0 },
          { name: "Student Fees", targetAmount: 0 },
        ],
      },
      {
        name: "Living Expenses",
        isIncome: false,
        subcategories: [
          { name: "Rent", targetAmount: 0 },
          { name: "Food", targetAmount: 0 },
          { name: "Transportation", targetAmount: 0 },
          { name: "Utilities", targetAmount: 0 },
        ],
      },
    ],
  },
  {
    id: "family",
    name: "Family Budget",
    description: "Comprehensive budget for families with children",
    icon: <Heart className="h-4 w-4" />,
    categories: [
      {
        name: "Income",
        isIncome: true,
        subcategories: [
          { name: "Primary Income", targetAmount: 0 },
          { name: "Secondary Income", targetAmount: 0 },
          { name: "Other Income", targetAmount: 0 },
        ],
      },
      {
        name: "Housing",
        isIncome: false,
        subcategories: [
          { name: "Mortgage/Rent", targetAmount: 0 },
          { name: "Property Tax", targetAmount: 0 },
          { name: "Home Insurance", targetAmount: 0 },
          { name: "Maintenance", targetAmount: 0 },
        ],
      },
      {
        name: "Children",
        isIncome: false,
        subcategories: [
          { name: "Childcare", targetAmount: 0 },
          { name: "Education", targetAmount: 0 },
          { name: "Activities", targetAmount: 0 },
          { name: "Clothing", targetAmount: 0 },
        ],
      },
      {
        name: "Transportation",
        isIncome: false,
        subcategories: [
          { name: "Car Payment", targetAmount: 0 },
          { name: "Gas", targetAmount: 0 },
          { name: "Insurance", targetAmount: 0 },
          { name: "Maintenance", targetAmount: 0 },
        ],
      },
    ],
  },
];

export function BudgetTemplates() {
  const [appliedTemplates, setAppliedTemplates] = useState<Set<string>>(new Set());
  const utils = api.useUtils();
  
  const createCategory = api.budget.createCategory.useMutation({
    onSuccess: () => {
      void utils.budget.getCategories.invalidate();
    },
  });

  const createSubcategory = api.budget.createSubcategory.useMutation({
    onSuccess: () => {
      void utils.budget.getCategories.invalidate();
    },
  });

  const applyTemplate = async (template: BudgetTemplate) => {
    try {
      // Create categories
      for (const category of template.categories) {
        const createdCategory = await createCategory.mutateAsync({
          name: category.name,
          isIncome: category.isIncome,
        });

        // Create subcategories
        for (const subcategory of category.subcategories) {
          await createSubcategory.mutateAsync({
            name: subcategory.name,
            targetAmount: subcategory.targetAmount,
            categoryId: createdCategory.id,
          });
        }
      }

      setAppliedTemplates(prev => new Set(prev).add(template.id));
      toast.success(`${template.name} template applied successfully`);
    } catch (error) {
      toast.error("Failed to apply template", {
        description: "Please try again",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Budget Templates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {BUDGET_TEMPLATES.map((template) => (
          <div
            key={template.id}
            className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2 flex-1">
                {template.icon}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm">{template.name}</h4>
                    {appliedTemplates.has(template.id) && (
                      <Badge variant="secondary" className="text-xs">
                        <Check className="h-3 w-3 mr-1" />
                        Applied
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {template.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {template.categories.map((category, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {category.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              {!appliedTemplates.has(template.id) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => applyTemplate(template)}
                  disabled={createCategory.isPending || createSubcategory.isPending}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Apply
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
} 