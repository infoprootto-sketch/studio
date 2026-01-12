
'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Check, ChevronsUpDown } from 'lucide-react';
import type { Broadcast } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"


type Status = Broadcast['status'];
type RecurrenceType = Broadcast['type'];
type DisplayFrequency = Broadcast['displayFrequency'];

const dayOptions = [
    { value: 0, label: 'S' },
    { value: 1, label: 'M' },
    { value: 2, label: 'T' },
    { value: 3, label: 'W' },
    { value: 4, label: 'T' },
    { value: 5, label: 'F' },
    { value: 6, label: 'S' },
]


interface EditBroadcastDialogProps {
  broadcast: Broadcast | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (broadcast: Partial<Broadcast>) => void;
  roomCategories: string[];
}

export function EditBroadcastDialog({ broadcast, isOpen, onClose, onSave, roomCategories }: EditBroadcastDialogProps) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<Status>('Active');
  const [type, setType] = useState<RecurrenceType>('One-time');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: new Date(), to: addDays(new Date(), 7) });
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [targetCategories, setTargetCategories] = useState<string[]>([]);
  const [displayFrequency, setDisplayFrequency] = useState<DisplayFrequency>('always-visible');

  const { toast } = useToast();
  const isEditing = !!broadcast?.id;
  const [isCategoryPopoverOpen, setIsCategoryPopoverOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (broadcast) {
        setTitle(broadcast.title);
        setMessage(broadcast.message);
        setStatus(broadcast.status);
        setType(broadcast.type);
        setDateRange({ from: broadcast.startDate ? new Date(broadcast.startDate) : undefined, to: broadcast.endDate ? new Date(broadcast.endDate) : undefined });
        setStartTime(broadcast.startTime || '09:00');
        setEndTime(broadcast.endTime || '17:00');
        setDaysOfWeek(broadcast.daysOfWeek || []);
        setTargetCategories(broadcast.targetRoomCategories || []);
        setDisplayFrequency(broadcast.displayFrequency || 'always-visible');
      } else {
        // Reset for new broadcast
        setTitle('');
        setMessage('');
        setStatus('Active');
        setType('One-time');
        setDateRange({ from: new Date(), to: addDays(new Date(), 7) });
        setStartTime('09:00');
        setEndTime('17:00');
        setDaysOfWeek([]);
        setTargetCategories([]);
        setDisplayFrequency('always-visible');
      }
    }
  }, [broadcast, isOpen]);

  const handleSave = () => {
    if (!title || !message) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Title and message are required.",
      });
      return;
    }
    
    if (type === 'One-time' && (!dateRange?.from || !dateRange?.to)) {
         toast({ variant: "destructive", title: "Missing Dates", description: "Please select a start and end date." });
         return;
    }
     if (type === 'Recurring' && daysOfWeek.length === 0) {
         toast({ variant: "destructive", title: "Missing Days", description: "Please select at least one day for recurring broadcasts." });
         return;
    }

    const saveData: Partial<Broadcast> = {
      title,
      message,
      status,
      type,
      startDate: type === 'One-time' ? dateRange?.from : null,
      endDate: type === 'One-time' ? dateRange?.to : null,
      startTime: type === 'Recurring' ? startTime : null,
      endTime: type === 'Recurring' ? endTime : null,
      daysOfWeek: type === 'Recurring' ? daysOfWeek : null,
      targetRoomCategories: targetCategories,
      displayFrequency,
    };

    if (isEditing) {
      saveData.id = broadcast.id;
    }

    onSave(saveData);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Broadcast' : 'Create New Broadcast'}</DialogTitle>
          <DialogDescription>
            Configure the message and display rules for this announcement.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" placeholder="e.g., Happy Hour Special" />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="message" className="text-right pt-2">Message</Label>
                <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} className="col-span-3" placeholder="e.g., Enjoy 50% off all cocktails from 5 PM to 7 PM!" />
            </div>
            
             <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as RecurrenceType)}>
                    <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="One-time">One-time Event</SelectItem>
                        <SelectItem value="Recurring">Recurring Daily</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            
            {type === 'One-time' ? (
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Date Range</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn("col-span-3 justify-start text-left font-normal", !dateRange && "text-muted-foreground")}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange?.from ? (dateRange.to ? `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}`: format(dateRange.from, "LLL dd, y")) : <span>Pick a date range</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
                        </PopoverContent>
                    </Popover>
                </div>
            ) : (
                <>
                   <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Time</Label>
                        <div className="col-span-3 grid grid-cols-2 gap-2">
                             <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                             <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                        </div>
                   </div>
                   <div className="grid grid-cols-4 items-start gap-4">
                       <Label className="text-right pt-2">Days</Label>
                       <ToggleGroup type="multiple" value={daysOfWeek.map(String)} onValueChange={(v) => setDaysOfWeek(v.map(Number))} className="col-span-3">
                           {dayOptions.map(day => (
                               <ToggleGroupItem key={day.value} value={String(day.value)} aria-label={day.label} className="h-9 w-9">
                                   {day.label}
                               </ToggleGroupItem>
                           ))}
                       </ToggleGroup>
                   </div>
                </>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Target Rooms</Label>
                 <Popover open={isCategoryPopoverOpen} onOpenChange={setIsCategoryPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="col-span-3 justify-start font-normal">
                             {targetCategories.length > 0 ? `${targetCategories.length} selected` : "All Room Categories"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                            <CommandInput placeholder="Search categories..." />
                            <CommandList>
                                <CommandEmpty>No categories found.</CommandEmpty>
                                <CommandGroup>
                                    {roomCategories.map(category => (
                                        <CommandItem
                                            key={category}
                                            onSelect={() => {
                                                setTargetCategories(prev => 
                                                    prev.includes(category) 
                                                    ? prev.filter(c => c !== category) 
                                                    : [...prev, category]
                                                )
                                            }}
                                        >
                                             <Check className={cn("mr-2 h-4 w-4", targetCategories.includes(category) ? "opacity-100" : "opacity-0")} />
                                            {category}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                 </Popover>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
                    <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Draft">Draft</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="frequency" className="text-right">Display Rule</Label>
                <Select value={displayFrequency} onValueChange={(v) => setDisplayFrequency(v as DisplayFrequency)}>
                    <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="always-visible">Always Visible (Rotating)</SelectItem>
                        <SelectItem value="once-per-session">Once per Session</SelectItem>
                        <SelectItem value="once-per-hour">Once per Hour</SelectItem>
                        <SelectItem value="once-per-day">Once per Day</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave}>{isEditing ? 'Save Changes' : 'Create Broadcast'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
