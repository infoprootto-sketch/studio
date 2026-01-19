

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import type { Room, RoomStatus, Stay } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { addDays, format, differenceInCalendarDays, isToday, startOfDay, isBefore } from 'date-fns';
import { Calendar as CalendarIcon, Check, Wind, XCircle, Trash2, LogIn, Clipboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';
import { useSettings } from '@/context/settings-context';
import { useRooms } from '@/context/room-context';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { useRouter } from 'next/navigation';
import { useHotelId } from '@/context/hotel-id-context';

interface ManageStaySheetProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
  rooms: Room[];
  stayId?: string;
  action?: 'manage' | 'check-in' | 'clean' | 'out-of-order';
  initialDate?: Date;
}

const getNextStatuses = (currentStatus?: RoomStatus): RoomStatus[] => {
    if (!currentStatus) return [];
    switch (currentStatus) {
        case 'Available':
            return ['Waiting for Check-in', 'Reserved', 'Out of Order'];
        case 'Waiting for Check-in':
            return ['Occupied', 'Available']; // Guest arrived or cancelled
        case 'Reserved':
            return ['Occupied', 'Available']; // Guest arrived or cancelled
        case 'Occupied':
            return ['Cleaning']; // After checkout
        case 'Cleaning':
            return ['Available', 'Out of Order'];
        case 'Out of Order':
            return ['Available', 'Cleaning'];
        default:
            return [];
    }
}

export function ManageStaySheet({ room: roomProp, rooms, stayId: stayIdProp, isOpen, onClose, action = 'check-in', initialDate }: ManageStaySheetProps) {
  const { addStay, updateStay, removeStay, updateRoom, checkInStay } = useRooms();

  const [status, setStatus] = useState<RoomStatus | undefined>();
  const [guestName, setGuestName] = useState('');
  const [guestNumber, setGuestNumber] = useState('');
  const [roomCharge, setRoomCharge] = useState<number | ''>('');
  const [date, setDate] = React.useState<DateRange | undefined>(() => {
    const from = initialDate && !isBefore(initialDate, startOfDay(new Date())) ? initialDate : new Date();
    return { from, to: addDays(from, 1) };
  });

  const { toast } = useToast();
  const { currency } = useSettings();
  const router = useRouter();
  const hotelId = useHotelId();
  
  const room = roomProp;
  const stay = stayIdProp && room ? room.stays.find(s => s.stayId === stayIdProp) : null;

  useEffect(() => {
    if (isOpen) {
      if (stay && room) { // Editing an existing stay
        setGuestName(stay.guestName);
        setGuestNumber(stay.guestNumber || '');
        setRoomCharge(stay.roomCharge);
        setDate({ from: new Date(stay.checkInDate), to: new Date(stay.checkOutDate) });
      } else { // Creating a new stay
        const from = initialDate && !isBefore(initialDate, startOfDay(new Date())) ? initialDate : new Date();
        setGuestName('');
        setGuestNumber('');
        setRoomCharge('');
        setDate({ from, to: addDays(from, 1) });
      }
      setStatus(undefined);
    }
  }, [action, room, stay, initialDate, isOpen]);
  

  const handleSave = async () => {
    if (!room || !stay) return;

    if (!guestName || !roomCharge || !date?.from || !date?.to) {
        toast({ variant: "destructive", title: "Missing Information" });
        return;
    }
    await updateStay(room.id, stay.stayId, {
        guestName, guestNumber, roomCharge: Number(roomCharge),
        checkInDate: date.from, checkOutDate: date.to
    });
    toast({ title: "Booking Updated" });
    onClose();
  };
  
  const handleStatusChange = async (newStatus?: RoomStatus) => {
      const statusToApply = newStatus || status;
      if (!room || !statusToApply) return;

      if (statusToApply === 'Occupied' && stay) {
        checkInStay(room.id, stay.stayId);
        toast({ title: "Guest Checked In", description: `${stay.guestName} has been checked into Room ${room.number}.`});
      } else if (statusToApply === 'Available' && stay) {
        // This is a cancellation for a "Waiting for Check-in" or "Reserved" stay.
        await removeStay(room.id, stay.stayId);
        toast({ title: "Booking Cancelled", description: `The booking for Room ${room.number} has been cancelled.` });
      } else {
        // This handles cases like 'Cleaning' -> 'Available'
        updateRoom(room.id, { status: statusToApply });
        toast({ title: "Status Updated", description: `Room ${room.number} status set to ${statusToApply}.` });
      }
      onClose();
  }
  
  const handleDeleteBooking = async () => {
    if(!room || !stay) return;
    await removeStay(room.id, stay.stayId);
    toast({ title: "Booking Deleted", description: "The booking has been removed.", variant: "destructive" });
    onClose();
  }


  const disabledDates = useMemo(() => {
    if (!room) return [];
    
    const otherStays = room.stays
      .filter(s => s.stayId !== stay?.stayId)
      .map(s => ({ from: startOfDay(s.checkInDate), to: startOfDay(s.checkOutDate) }))
      .filter(r => r.from && r.to);

    const outOfOrder = (room.outOfOrderBlocks || [])
      .map(b => ({ from: startOfDay(b.from), to: startOfDay(b.to) }));
      
    return [...otherStays, ...outOfOrder];

  }, [room, stay]);

  const title = action === 'clean' ? `Room Cleaning` : (action === 'out-of-order' ? 'Room Out of Order' : (stayIdProp ? `Manage Stay` : `Create New Booking`));
  const description = action === 'clean' 
    ? `Room ${room?.number} requires cleaning. Mark as available when ready.`
    : action === 'out-of-order'
    ? `Room ${room?.number} is out of order. Mark as available when resolved.`
    : (stayIdProp 
        ? `Update booking details for ${stay?.guestName} in Room ${room?.number}.`
        : `Select an available room and enter guest details.`);
  
  const nights = date?.from && date?.to ? differenceInCalendarDays(date.to, date.from) : 0;
  
  const isEditingStay = !!stay;
  const uniqueStayId = stay?.stayId;


  if ((action === 'clean' || action === 'out-of-order') && room) {
    const Icon = action === 'clean' ? Wind : XCircle;
    const color = action === 'clean' ? 'text-blue-500' : 'text-gray-500';
    const statusText = action === 'clean' ? 'Cleaning' : 'Out of Order';
    
    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>{title}</SheetTitle>
                    <SheetDescription>{description}</SheetDescription>
                </SheetHeader>
                 <div className="py-8 flex flex-col items-center justify-center text-center">
                    <Icon className={cn("size-16 mb-4", color)} />
                    <p>Room <span className="font-bold">{room.number}</span> is currently in <span className={cn("font-semibold", color)}>{statusText}</span> status.</p>
                </div>
                <SheetFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={() => {
                        updateRoom(room.id, { status: 'Available', checkOutDate: undefined });
                        toast({ title: "Room Available", description: `Room ${room.number} is now available for booking.` });
                        onClose();
                    }}>
                        <Check className="mr-2" /> Mark as Available
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
  }
  
  if (!isEditingStay && isOpen) {
    // This case should no longer happen from the availability grid.
    // We navigate away instead. We can leave this as a fallback or remove it.
    // For now, let's close it and navigate.
    router.push(`/${hotelId}/dashboard/reservations/create-booking`);
    onClose();
    return null;
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-xl w-full">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <div className="py-4 space-y-4">
            {uniqueStayId && (
                 <div className="space-y-2">
                    <Label htmlFor="stay-id">Stay ID</Label>
                    <div className="flex items-center gap-2">
                        <Input id="stay-id" readOnly disabled value={uniqueStayId} className="font-mono text-xs" />
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                                navigator.clipboard.writeText(uniqueStayId);
                                toast({ title: "Stay ID Copied!" });
                            }}
                        >
                            <Clipboard className="size-4" />
                            <span className="sr-only">Copy Stay ID</span>
                        </Button>
                    </div>
                </div>
            )}
            <div className="space-y-2">
                <Label htmlFor="guest-name">Guest Name</Label>
                <Input id="guest-name" value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="John Doe" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="guest-number">Guest Phone Number</Label>
                <Input id="guest-number" value={guestNumber} onChange={(e) => setGuestNumber(e.target.value)} placeholder="+1 123 456 7890" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="room-charge">Charge / Night ({currency})</Label>
                    <Input id="room-charge" type="number" value={roomCharge} onChange={(e) => setRoomCharge(Number(e.target.value) || '')} placeholder="150" />
                </div>
                <div className="space-y-2">
                    <Label>Stay Duration ({nights} {nights === 1 ? 'night' : 'nights'})</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date?.from ? (date.to ? (<>{format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}</>) : (format(date.from, "LLL dd, y"))) : (<span>Pick a date</span>)}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={date?.from}
                            selected={date}
                            onSelect={setDate}
                            numberOfMonths={1}
                            disabled={[...disabledDates, { before: new Date() }]}
                        />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {room && room.displayStatus !== 'Occupied' && (
                <div className="space-y-2 pt-4 border-t">
                    <Label htmlFor="room-status">Update Status</Label>
                    <div className="flex gap-2">
                        <Select value={status} onValueChange={(value) => setStatus(value as RoomStatus)}>
                            <SelectTrigger id="room-status">
                                <SelectValue placeholder="Change status..." />
                            </SelectTrigger>
                            <SelectContent>
                                {getNextStatuses(room?.displayStatus).map((s) => (
                                <SelectItem key={s} value={s}>
                                    {s}
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                         <Button onClick={() => handleStatusChange()} disabled={!status}>Apply</Button>
                    </div>
                </div>
            )}
        </div>
        
        <SheetFooter className="absolute bottom-0 left-0 right-0 p-6 bg-background border-t">
            <div className="flex justify-between w-full">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                        <Trash2 className="mr-2"/>
                        Delete Booking
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete this booking. This action cannot be undone.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteBooking}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                {room?.displayStatus === 'Waiting for Check-in' ? (
                    <Button onClick={() => handleStatusChange('Occupied')}>
                        <LogIn className="mr-2" />
                        Mark as Arrived & Check-in
                    </Button>
                ) : (
                    <Button onClick={handleSave}>Save Changes</Button>
                )}
            </div>
            </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
