"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTimeframe, TimeframeType } from "@/components/providers/timeframe-provider";

export function TimeframeSelector() {
  const { timeframe, setTimeframe, getTimeframeLabel } = useTimeframe();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">Timeframe:</span>
      <Select value={timeframe} onValueChange={(value: TimeframeType) => setTimeframe(value)}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {/* <SelectItem value="7d">Last 7 Days</SelectItem>
          <SelectItem value="30d">Last 30 Days</SelectItem>
          <SelectItem value="90d">Last 90 Days</SelectItem>
          <SelectItem value="6m">Last 6 Months</SelectItem> */}
          {/* <SelectItem value="currentMonth">This Month</SelectItem> */}
          <SelectItem value="lastMonth">Last Month</SelectItem>
          <SelectItem value="last3Months">Last 3 Months</SelectItem>
          <SelectItem value="last6Months">Last 6 Months</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
} 