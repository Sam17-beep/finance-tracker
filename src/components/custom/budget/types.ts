import { type RouterOutputs } from "@/trpc/shared";

// API Types
export type Category = RouterOutputs["budget"]["getCategories"][number];
export type Subcategory = Category["subcategories"][number];

// UI Types
export interface CategoryWithUI extends Category {
  isExpanded: boolean;
}

export interface SubcategoryFormData {
  name: string;
  amount: string;
}

export interface CategoryFormData {
  name: string;
  isIncome: boolean;
}

export interface BudgetTotals {
  income: number;
  expenses: number;
  balance: number;
} 