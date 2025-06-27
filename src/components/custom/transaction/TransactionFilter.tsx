import {
  type DateRange,
  DateRangePicker,
} from "@/components/ui/DateRangePicker";
import { api } from "@/trpc/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Filter, Calendar, Tag, Hash } from "lucide-react";

interface TransactionFilterProps {
  dateRange: DateRange;
  setDateRange: (dateRange: DateRange) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedSubcategory: string;
  setSelectedSubcategory: (subcategory: string) => void;
}

export function TransactionFilter({
  dateRange,
  setDateRange,
  selectedCategory,
  setSelectedCategory,
  selectedSubcategory,
  setSelectedSubcategory,
}: TransactionFilterProps) {
  const { data: categories } = api.budget.getCategories.useQuery();

  const selectedCategoryName = categories?.find(cat => cat.id === selectedCategory)?.name;
  const selectedSubcategoryName = categories
    ?.find(cat => cat.id === selectedCategory)
    ?.subcategories.find(sub => sub.id === selectedSubcategory)?.name;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filter Transactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date Range
            </label>
            <DateRangePicker value={dateRange} onChange={setDateRange} />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Category
            </label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">All Categories</SelectItem>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <span>{category.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {category.subcategories.length}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCategoryName && (
              <div className="text-xs text-muted-foreground">
                Selected: {selectedCategoryName}
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Subcategory
            </label>
            <Select
              value={selectedSubcategory}
              onValueChange={setSelectedSubcategory}
              disabled={selectedCategory === "any"}
            >
              <SelectTrigger>
                <SelectValue placeholder={selectedCategory === "any" ? "Select category first" : "All subcategories"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">All Subcategories</SelectItem>
                {categories
                  ?.filter((cat) => cat.id === selectedCategory)
                  .map((category) =>
                    category.subcategories.map((subcategory) => (
                      <SelectItem key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                      </SelectItem>
                    )),
                  )}
              </SelectContent>
            </Select>
            {selectedSubcategoryName && (
              <div className="text-xs text-muted-foreground">
                Selected: {selectedSubcategoryName}
              </div>
            )}
          </div>
        </div>
        
        {/* Active Filters Summary */}
        {(selectedCategory !== "any" || selectedSubcategory !== "any") && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">Active Filters:</span>
              {selectedCategory !== "any" && selectedCategoryName && (
                <Badge variant="secondary" className="text-xs">
                  Category: {selectedCategoryName}
                </Badge>
              )}
              {selectedSubcategory !== "any" && selectedSubcategoryName && (
                <Badge variant="secondary" className="text-xs">
                  Subcategory: {selectedSubcategoryName}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
