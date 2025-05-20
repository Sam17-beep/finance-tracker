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

  return (
    <div className="flex items-center gap-4">
      <DateRangePicker value={dateRange} onChange={setDateRange} />
      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
        <SelectTrigger>
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
      <Select
        value={selectedSubcategory}
        onValueChange={setSelectedSubcategory}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select subcategory" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Any Subcategory</SelectItem>
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
    </div>
  );
}
