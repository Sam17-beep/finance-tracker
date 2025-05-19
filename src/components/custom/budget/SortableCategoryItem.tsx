'use client'

import { Menu } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { type Category } from './types';
import { CategoryItem } from './CategoryItem';

interface SortableCategoryItemProps {
  category: Category;
  onDelete: () => void;
}

export function SortableCategoryItem({ category, onDelete }: SortableCategoryItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <CategoryItem 
        category={category} 
        onDelete={onDelete}
        dragHandle={
          <Button
            variant="ghost"
            size="icon"
            {...attributes}
            {...listeners}
            className="text-muted-foreground hover:text-foreground"
          >
            <Menu className="h-4 w-4" />
          </Button>
        }
      />
    </div>
  );
} 