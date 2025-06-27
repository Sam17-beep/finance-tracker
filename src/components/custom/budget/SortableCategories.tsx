'use client'

import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { type Category } from './types';
import { SortableCategoryItem } from './SortableCategoryItem';

interface SortableCategoriesProps {
  categories: Category[];
  onDeleteCategory: (categoryId: string) => void;
  lastMonthSpending?: {
    spendingByCategory: Record<string, number>;
    spendingBySubcategory: Record<string, number>;
  };
}

type CategoryOrder = [string, number][];

export function SortableCategories({ categories, onDeleteCategory, lastMonthSpending }: SortableCategoriesProps) {
  const [items, setItems] = useState<Category[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load order from localStorage and sort categories
  useEffect(() => {
    const savedOrder = localStorage.getItem('categoryOrder');
    let sortedCategories: Category[];

    if (savedOrder) {
      try {
        const orderMap = new Map<string, number>(JSON.parse(savedOrder) as CategoryOrder);
        
        // Create a map of existing categories for quick lookup
        const categoryMap = new Map(categories.map(cat => [cat.id, cat]));
        
        // First, add categories in the saved order
        sortedCategories = Array.from(orderMap.entries())
          .map(([id]) => categoryMap.get(id))
          .filter((cat): cat is Category => cat !== undefined);
        
        // Then, append any new categories that weren't in the saved order
        const existingIds = new Set(sortedCategories.map(cat => cat.id));
        const newCategories = categories.filter(cat => !existingIds.has(cat.id));
        sortedCategories = [...sortedCategories, ...newCategories];
      } catch (error) {
        console.error('Error parsing saved category order:', error);
        sortedCategories = categories;
      }
    } else {
      sortedCategories = categories;
    }

    setItems(sortedCategories);
  }, [categories]);

  // Save order to localStorage when it changes
  useEffect(() => {
    if (items.length > 0) {
      const orderMap = new Map<string, number>(items.map((item, index) => [item.id, index]));
      localStorage.setItem('categoryOrder', JSON.stringify(Array.from(orderMap.entries())));
    }
  }, [items]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-6">
          {items.map((category) => (
            <SortableCategoryItem
              key={category.id}
              category={category}
              onDelete={() => onDeleteCategory(category.id)}
              lastMonthSpending={lastMonthSpending}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
} 