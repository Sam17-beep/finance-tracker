'use client'

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface InlineEditProps {
  value: string | number;
  onSave: (value: string | number) => void;
  type?: 'text' | 'number';
  className?: string;
}

export function InlineEdit({ value, onSave, type = 'text', className = '' }: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditValue(value.toString());
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (type === 'number') {
      const numValue = Number.parseFloat(editValue);
      if (!isNaN(numValue) && numValue >= 0) {
        onSave(Number(numValue.toFixed(2)));
      } else {
        setEditValue(value.toString());
      }
    } else {
      if (editValue.trim()) {
        onSave(editValue.trim());
      } else {
        setEditValue(value.toString());
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(value.toString());
    }
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        type={type}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`h-6 px-1 py-0 ${className}`}
        min={type === 'number' ? 0 : undefined}
        step={type === 'number' ? 0.01 : undefined}
      />
    );
  }

  return (
    <span
      onDoubleClick={handleDoubleClick}
      className={`cursor-pointer select-none ${className}`}
    >
      {type === 'number' ? `$${Number(value).toFixed(2)}` : value}
    </span>
  );
} 