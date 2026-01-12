
"use client"

import * as React from "react"
import { format, addDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, sub } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"

const PRESETS = [
    { name: "today", label: "Today", getRange: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) })},
    { name: "yesterday", label: "Yesterday", getRange: () => ({ from: startOfDay(sub(new Date(), {days: 1})), to: endOfDay(sub(new Date(), {days: 1})) })},
    { name: "thisWeek", label: "This week", getRange: () => ({ from: startOfWeek(new Date()), to: endOfWeek(new Date()) })},
    { name: "lastWeek", label: "Last week", getRange: () => ({ from: startOfWeek(sub(new Date(), {weeks: 1})), to: endOfWeek(sub(new Date(), {weeks: 1})) })},
    { name: "thisMonth", label: "This month", getRange: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) })},
    { name: "lastMonth", label: "Last month", getRange: () => ({ from: startOfMonth(sub(new Date(), {months: 1})), to: endOfMonth(sub(new Date(), {months: 1})) })},
    { name: "last30", label: "Last 30 days", getRange: () => ({ from: startOfDay(sub(new Date(), {days: 29})), to: endOfDay(new Date()) })},
    { name: "last90", label: "Last 90 days", getRange: () => ({ from: startOfDay(sub(new Date(), {days: 89})), to: endOfDay(new Date()) })},
];


interface DateRangePickerProps extends React.HTMLAttributes<HTMLDivElement> {
    dateRange: DateRange | undefined;
    setDateRange: (dateRange: DateRange | undefined) => void;
}

export function DateRangePicker({
  className,
  dateRange,
  setDateRange,
}: DateRangePickerProps) {
    const [selectedPreset, setSelectedPreset] = React.useState<string | undefined>(undefined);

    const handlePresetChange = (presetName: string) => {
        const preset = PRESETS.find(p => p.name === presetName);
        if (preset) {
            setDateRange(preset.getRange());
            setSelectedPreset(presetName);
        }
    };
    
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !dateRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "LLL dd, y")} -{" "}
                  {format(dateRange.to, "LLL dd, y")}
                </>
              ) : (
                format(dateRange.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 flex" align="end">
            <div className="flex flex-col space-y-2 border-r p-4">
                <Select onValueChange={handlePresetChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a preset" />
                    </SelectTrigger>
                    <SelectContent>
                        {PRESETS.map(preset => (
                            <SelectItem key={preset.name} value={preset.name}>{preset.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
            />
        </PopoverContent>
      </Popover>
    </div>
  )
}
