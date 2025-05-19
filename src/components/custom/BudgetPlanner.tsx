"use client"

import { useState } from "react"
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

// Define types for our budget data
interface Subcategory {
  id: string
  name: string
  targetAmount: number
}

interface Category {
  id: string
  name: string
  isIncome: boolean
  subcategories: Subcategory[]
  isExpanded: boolean
}

export default function BudgetPlanner() {
  const [categories, setCategories] = useState<Category[]>([])
  const [newCategoryName, setNewCategoryName] = useState("")
  const [isIncome, setIsIncome] = useState(false)

  // State for new subcategory forms (one per category)
  const [newSubcategoryInputs, setNewSubcategoryInputs] = useState<{
    [categoryId: string]: { name: string; amount: string }
  }>({})

  // Initialize subcategory inputs for a category
  const initializeSubcategoryInputs = (categoryId: string) => {
    setNewSubcategoryInputs((prev) => ({
      ...prev,
      [categoryId]: { name: "", amount: "" },
    }))
  }

  // Add a new category
  const addCategory = () => {
    if (newCategoryName.trim() === "") return

    const newCategory: Category = {
      id: Date.now().toString(),
      name: newCategoryName,
      isIncome,
      subcategories: [],
      isExpanded: true,
    }

    setCategories([...categories, newCategory])
    setNewCategoryName("")
    initializeSubcategoryInputs(newCategory.id)
  }

  // Toggle category expansion
  const toggleCategoryExpansion = (categoryId: string) => {
    setCategories(
      categories.map((category) => {
        if (category.id === categoryId) {
          return {
            ...category,
            isExpanded: !category.isExpanded,
          }
        }
        return category
      }),
    )
  }

  // Update subcategory input fields
  const updateSubcategoryInput = (categoryId: string, field: "name" | "amount", value: string) => {
    setNewSubcategoryInputs((prev) => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        [field]: value,
      },
    }))
  }

  // Add a subcategory to a category
  const addSubcategory = (categoryId: string) => {
    const inputs = newSubcategoryInputs[categoryId]
    if (!inputs || inputs.name.trim() === "" || isNaN(Number.parseFloat(inputs.amount))) return

    const amount = Number.parseFloat(Number.parseFloat(inputs.amount).toFixed(2))
    if (amount < 0) return

    const newSubcategory: Subcategory = {
      id: Date.now().toString(),
      name: inputs.name,
      targetAmount: amount,
    }

    setCategories(
      categories.map((category) => {
        if (category.id === categoryId) {
          return {
            ...category,
            subcategories: [...category.subcategories, newSubcategory],
          }
        }
        return category
      }),
    )

    // Reset the input fields for this category
    setNewSubcategoryInputs((prev) => ({
      ...prev,
      [categoryId]: { name: "", amount: "" },
    }))
  }

  // Delete a category
  const deleteCategory = (categoryId: string) => {
    setCategories(categories.filter((category) => category.id !== categoryId))

    // Clean up subcategory inputs
    setNewSubcategoryInputs((prev) => {
      const newInputs = { ...prev }
      delete newInputs[categoryId]
      return newInputs
    })
  }

  // Delete a subcategory
  const deleteSubcategory = (categoryId: string, subcategoryId: string) => {
    setCategories(
      categories.map((category) => {
        if (category.id === categoryId) {
          return {
            ...category,
            subcategories: category.subcategories.filter((sub) => sub.id !== subcategoryId),
          }
        }
        return category
      }),
    )
  }

  // Calculate the total target amount for a category
  const calculateCategoryTotal = (category: Category) => {
    return category.subcategories.reduce((total, sub) => total + sub.targetAmount, 0)
  }

  // Calculate overall budget totals
  const calculateTotals = () => {
    let totalIncome = 0
    let totalExpenses = 0

    categories.forEach((category) => {
      const categoryTotal = calculateCategoryTotal(category)
      if (category.isIncome) {
        totalIncome += categoryTotal
      } else {
        totalExpenses += categoryTotal
      }
    })

    return {
      income: totalIncome,
      expenses: totalExpenses,
      balance: totalIncome - totalExpenses,
    }
  }

  const totals = calculateTotals()

  // Initialize subcategory inputs for any new categories
  categories.forEach((category) => {
    if (!newSubcategoryInputs[category.id]) {
      initializeSubcategoryInputs(category.id)
    }
  })

  return (
    <div className="space-y-8">
      {/* Budget Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Income</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">${totals.income.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">${totals.expenses.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-muted-foreground">Balance</p>
              <p
                className={`text-2xl font-bold ${
                  totals.balance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                }`}
              >
                ${totals.balance.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Category Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category-name">Category Name</Label>
                <Input
                  id="category-name"
                  placeholder="e.g., Housing, Transportation"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
              </div>
              <div className="flex items-end space-x-2">
                <div className="space-y-2">
                  <Label htmlFor="is-income">Income Category</Label>
                  <div className="flex items-center space-x-2">
                    <Switch id="is-income" checked={isIncome} onCheckedChange={setIsIncome} />
                    <span>{isIncome ? "Income" : "Expense"}</span>
                  </div>
                </div>
                <Button onClick={addCategory} className="ml-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Category
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories and Subcategories List */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No categories added yet. Add a category to get started.
            </p>
          ) : (
            <div className="space-y-6">
              {categories.map((category) => (
                <div key={category.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleCategoryExpansion(category.id)}
                        className="h-6 w-6 p-0"
                      >
                        {category.isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                      <h3 className="text-lg font-semibold">{category.name}</h3>
                      <Badge variant={category.isIncome ? "success" : "destructive"}>
                        {category.isIncome ? "Income" : "Expense"}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total Target</p>
                        <p className="font-medium">${calculateCategoryTotal(category).toFixed(2)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteCategory(category.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {category.isExpanded && (
                    <>
                      {/* Add Subcategory Form for this Category */}
                      <div className="mb-4 p-3 bg-muted/50 rounded-md">
                        <h4 className="text-sm font-medium mb-2">Add Subcategory to {category.name}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Input
                            placeholder="Subcategory name"
                            value={newSubcategoryInputs[category.id]?.name || ""}
                            onChange={(e) => updateSubcategoryInput(category.id, "name", e.target.value)}
                          />
                          <div className="flex space-x-2">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="Target amount (0.00)"
                              value={newSubcategoryInputs[category.id]?.amount || ""}
                              onChange={(e) => updateSubcategoryInput(category.id, "amount", e.target.value)}
                            />
                            <Button onClick={() => addSubcategory(category.id)}>
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Subcategories Table */}
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
                                <TableCell className="text-right">${subcategory.targetAmount.toFixed(2)}</TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => deleteSubcategory(category.id, subcategory.id)}
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
