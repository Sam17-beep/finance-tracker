"use client";

import { CalendarIcon } from "lucide-react";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { SelectSingleEventHandler, DayModifiers } from "react-day-picker";
import { useState } from "react";

export interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
  className?: string;
}

type ModifierFunction = (date: Date) => boolean;

export function DateRangePicker({
  value,
  onChange,
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<{
    from: Date | null;
    to: Date | null;
  }>({
    from: value.from,
    to: value.to,
  });

  const handleSelect: SelectSingleEventHandler = (date: Date | undefined) => {
    if (!date) return;

    if (!selectedRange.from) {
      // Start new range
      setSelectedRange({ from: date, to: null });
    } else if (!selectedRange.to && date > selectedRange.from) {
      // Complete range
      const newRange = { from: selectedRange.from, to: date };
      setSelectedRange(newRange);
      onChange(newRange as DateRange);
      setIsOpen(false);
    } else {
      // Reset range
      setSelectedRange({ from: date, to: null });
    }
  };

  const isDateSelected: ModifierFunction = (date: Date) => {
    if (!selectedRange.from) return false;
    if (!selectedRange.to)
      return date.getTime() === selectedRange.from.getTime();
    return isWithinInterval(date, {
      start: startOfDay(selectedRange.from),
      end: endOfDay(selectedRange.to),
    });
  };

  const isDateInRange: ModifierFunction = (date: Date) => {
    if (!selectedRange.from || !selectedRange.to) return false;
    return isWithinInterval(date, {
      start: startOfDay(selectedRange.from),
      end: endOfDay(selectedRange.to),
    });
  };

  const modifiers = {
    selected: isDateSelected,
    inRange: isDateInRange,
  } satisfies DayModifiers;

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !value && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value.from ? (
              value.to ? (
                <>
                  {format(value.from, "LLL dd, y")} -{" "}
                  {format(value.to, "LLL dd, y")}
                </>
              ) : (
                format(value.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedRange.from ?? undefined}
            onSelect={handleSelect}
            modifiers={modifiers}
            numberOfMonths={2}
            defaultMonth={value.from}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
