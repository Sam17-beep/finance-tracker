'use client'

import { useState } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type Category } from "./types";
import { SubcategoryForm } from "./SubcategoryForm";
import { api } from "@/trpc/react";
import { toast } from "sonner";

interface CategoryItemProps {
  category: Category;
  onDelete: () => void;
}

export function CategoryItem({ category, onDelete }: CategoryItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const utils = api.useUtils();
  const deleteSubcategory = api.budget.deleteSubcategory.useMutation({
    onSuccess: () => {
      void utils.budget.getCategories.invalidate();
      toast.success("Subcategory deleted successfully");
    },
    onError: (error) => {
      toast.error("Error deleting subcategory", {
        description: error.message,
      });
    },
  });

  const calculateCategoryTotal = () => {
    return category.subcategories.reduce((total, sub) => total + Number(sub.targetAmount), 0);
  };

  const handleDeleteSubcategory = (subcategoryId: string) => {
    deleteSubcategory.mutate(subcategoryId);
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 p-0"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <h3 className="text-lg font-semibold">{category.name}</h3>
          <Badge variant={category.isIncome ? "default" : "destructive"}>
            {category.isIncome ? "Income" : "Expense"}
          </Badge>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Target</p>
            <p className="font-medium">${calculateCategoryTotal().toFixed(2)}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="text-red-500 hover:text-red-700 hover:bg-red-100"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isExpanded && (
        <>
          <SubcategoryForm categoryId={category.id} />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subcategory</TableHead>
                <TableHead className="text-right">Target Amount</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {category.subcategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No subcategories added yet
                  </TableCell>
                </TableRow>
              ) : (
                category.subcategories.map((subcategory) => (
                  <TableRow key={subcategory.id}>
                    <TableCell>{subcategory.name}</TableCell>
                    <TableCell className="text-right">
                      ${Number(subcategory.targetAmount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteSubcategory(subcategory.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </>
      )}
    </div>
  );
} 