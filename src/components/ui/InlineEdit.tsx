"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface InlineEditProps {
  value: string | number;
  onSave: (value: string | number) => void;
  type?: "text" | "number";
  className?: string;
  renderedValue?: React.ReactNode;
}

export function InlineEdit({
  value,
  onSave,
  type = "text",
  className = "",
  renderedValue,
}: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(
    type === "number" ? Number(value).toFixed(2) : value.toString(),
  );
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditValue(
      type === "number" ? Number(value).toFixed(2) : value.toString(),
    );
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (type === "number") {
      const numValue = Number.parseFloat(editValue.replace(/[^0-9.-]/g, ""));
      if (!isNaN(numValue)) {
        onSave(Number(numValue.toFixed(2)));
      } else {
        setEditValue(Number(value).toFixed(2));
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
    if (e.key === "Enter") {
      handleBlur();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditValue(
        type === "number" ? Number(value).toFixed(2) : value.toString(),
      );
    }
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        type={type}
        value={editValue}
        onChange={(e) => {
          if (type === "number") {
            const newValue = e.target.value.replace(/[^0-9.-]/g, "");
            setEditValue(newValue);
          } else {
            setEditValue(e.target.value);
          }
        }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`h-6 px-1 py-0 ${className}`}
        min={type === "number" ? 0 : undefined}
        step={type === "number" ? 0.01 : undefined}
      />
    );
  }

  return (
    <span
      onDoubleClick={handleDoubleClick}
      className={`cursor-pointer select-none ${className}`}
    >
      {renderedValue ??
        (type === "number" ? `$${Number(value).toFixed(2)}` : value)}
    </span>
  );
}
