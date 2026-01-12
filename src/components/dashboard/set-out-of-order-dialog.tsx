
'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import type { Room } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { addDays, format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

interface SetOutOfOrderDialogProps {
  room: Room | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (roomId: string, dateRange: DateRange) => void;
}

export function SetOutOfOrderDialog({ room, isOpen, onClose, onConfirm }: SetOutOfOrderDialogProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 1),
  });
  const { toast } = useToast();

  const handleConfirm = () => {
    if (!room || !dateRange || !dateRange.from || !dateRange.to) {
      toast({
        variant: "destructive",
        title: "Invalid Date Range",
        description: "Please select a valid start and end date.",
      });
      return;
    }
    onConfirm(room.id, dateRange);
    onClose();
  };

  if (!isOpen || !room) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Room {room.number} as Out of Order</DialogTitle>
          <DialogDescription>
            Select the date range during which this room will be unavailable for bookings.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4 flex flex-col items-center">
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
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={1}
                fromDate={new Date()}
              />
            </PopoverContent>
          </Popover>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
