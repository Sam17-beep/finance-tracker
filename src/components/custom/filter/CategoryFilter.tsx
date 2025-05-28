"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { api } from "@/trpc/react";

interface CategoryFilterProps {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedSubcategory: string;
  setSelectedSubcategory: (subcategory: string) => void;
}

export const CategoryFilter = ({
  selectedCategory,
  setSelectedCategory,
  selectedSubcategory,
  setSelectedSubcategory,
}: CategoryFilterProps) => {
  const { data: categories } = api.budget.getCategories.useQuery();

  return (
    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
      <div>
        <label
          htmlFor="category-select"
          className="text-muted-foreground block text-sm font-medium"
        >
          Category:
        </label>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger id="category-select" className="mt-1">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any Category</SelectItem>
            {categories?.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label
          htmlFor="subcategory-select"
          className="text-muted-foreground block text-sm font-medium"
        >
          Subcategory:
        </label>
        <Select
          value={selectedSubcategory}
          onValueChange={setSelectedSubcategory}
          disabled={selectedCategory === "any"}
        >
          <SelectTrigger id="subcategory-select" className="mt-1">
            <SelectValue placeholder="Select subcategory" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any Subcategory</SelectItem>
            {categories
              ?.find((cat) => cat.id === selectedCategory)
              ?.subcategories.map((subcategory) => (
                <SelectItem key={subcategory.id} value={subcategory.id}>
                  {subcategory.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
