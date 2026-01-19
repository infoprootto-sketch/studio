

'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import type { Room, Stay, RoomCategory } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { addDays, format, differenceInCalendarDays, startOfDay, isBefore } from 'date-fns';
import { Calendar as CalendarIcon, Users, Bed, IndianRupee, User, PlusCircle, Star, Trash2, Upload, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';
import { useSettings } from '@/context/settings-context';
import { useRoomActions, useRoomState } from '@/context/room-context';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from '../ui/select';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '../ui/card';
import Papa from 'papaparse';


type BookingType = 'single' | 'group';
type BillingOption = 'separate' | 'clubbed';

interface GroupRoomAssignment {
    roomId: string;
    guestName: string;
    guestNumber: string;
    roomCharge: number | '';
}

interface CsvRow {
    room_number: string;
    guest_name: string;
    guest_number?: string;
    room_charge?: string;
}

export function BookingForm() {
  const { rooms, roomCategories } = useRoomState();
  const { addStay, addGroupBooking } = useRoomActions();
  const { toast } = useToast();
  const { currency, formatPrice } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [bookingType, setBookingType] = useState<BookingType>('single');
  const [billingOption, setBillingOption] = useState<BillingOption>('separate');
  const [primaryGuestName, setPrimaryGuestName] = useState('');
  const [primaryGuestNumber, setPrimaryGuestNumber] = useState('');
  const [selectedRooms, setSelectedRooms] = useState<Room[]>([]);
  const [groupAssignments, setGroupAssignments] = useState<Record<string, Partial<GroupRoomAssignment>>>({});
  const [primaryBillingRoomId, setPrimaryBillingRoomId] = useState<string | undefined>();
  
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isRoomPickerOpen, setIsRoomPickerOpen] = useState(false);
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 1),
  });

  const availableRooms = useMemo(() => {
    if (!date?.from || !date?.to) return [];
    
    const fromDate = startOfDay(date.from);
    const toDate = startOfDay(date.to);

    return rooms.filter(r => {
        const isUnavailable = r.stays.some(s => 
            new Date(s.checkInDate) < toDate && new Date(s.checkOutDate) > fromDate
        ) || (r.outOfOrderBlocks || []).some(b => 
            new Date(b.from) < toDate && new Date(b.to) > fromDate
        );
        return !isUnavailable;
    });
  }, [rooms, date]);

  const resetForm = () => {
    setBookingType('single');
    setBillingOption('separate');
    setPrimaryGuestName('');
    setPrimaryGuestNumber('');
    setSelectedRooms([]);
    setGroupAssignments({});
    setPrimaryBillingRoomId(undefined);
    setDate({ from: new Date(), to: addDays(new Date(), 1) });
  };
  
  const handleBookingTypeChange = (type: BookingType) => {
    resetForm();
    setBookingType(type);
  }

  const handleCreateBooking = async () => {
    if (!date?.from || !date?.to || selectedRooms.length === 0) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please fill all fields and select at least one room." });
      return;
    }

    if (bookingType === 'single') {
        if (!primaryGuestName || !primaryGuestNumber) {
            toast({ variant: "destructive", title: "Missing Guest Details", description: "Please enter the guest's name and number." });
            return;
        }
        const roomCharge = groupAssignments[selectedRooms[0].id]?.roomCharge;
        if (!roomCharge || Number(roomCharge) <= 0) {
            toast({ variant: "destructive", title: "Invalid Price", description: "Please set a valid price for the room." });
            return;
        }

        await addStay(selectedRooms[0].id, {
            guestName: primaryGuestName,
            guestNumber: primaryGuestNumber,
            roomCharge: Number(roomCharge),
            checkInDate: date.from!,
            checkOutDate: date.to!,
        });

        toast({ title: "Booking Created", description: `Room ${selectedRooms[0].number} has been booked for ${primaryGuestName}.` });

    } else { // Group Booking
        if (billingOption === 'clubbed' && !primaryBillingRoomId) {
            toast({ variant: "destructive", title: "Primary Room Required", description: "Please select a primary room for clubbed billing." });
            return;
        }

        const allAssignmentsValid = selectedRooms.every(room => 
            groupAssignments[room.id]?.guestName && 
            groupAssignments[room.id]?.roomCharge && Number(groupAssignments[room.id]?.roomCharge) > 0
        );

        if (!allAssignmentsValid) {
             toast({ variant: "destructive", title: "Missing Group Details", description: "Please fill in a guest name and price for every selected room." });
            return;
        }
        
        const roomAssignmentsForContext = selectedRooms.map(room => ({
            roomId: room.id,
            guestName: groupAssignments[room.id].guestName!,
            guestNumber: groupAssignments[room.id].guestNumber || primaryGuestNumber || '',
            roomCharge: Number(groupAssignments[room.id].roomCharge!)
        }));

        await addGroupBooking({
            primaryGuestName,
            primaryGuestNumber,
            checkInDate: date.from,
            checkOutDate: date.to,
            isClubbed: billingOption === 'clubbed',
            primaryRoomId: primaryBillingRoomId,
        }, roomAssignmentsForContext);


        toast({ title: "Group Booking Created", description: `${selectedRooms.length} rooms have been booked.` });
    }
    
    resetForm();
  };

  const handleRoomSelect = (room: Room, isSelected: boolean) => {
    let newSelectedRooms: Room[];
    if (isSelected) {
        if (selectedRooms.some(r => r.id === room.id)) return; // Prevent duplicates
        newSelectedRooms = [...selectedRooms, room];
    } else {
        newSelectedRooms = selectedRooms.filter(r => r.id !== room.id);
    }

    if (bookingType === 'single' && newSelectedRooms.length > 1) {
        toast({ title: "Single Booking", description: "Only one room can be selected for a single booking." });
        return;
    }
    
    setSelectedRooms(newSelectedRooms);
    
    if (primaryBillingRoomId && !newSelectedRooms.some(r => r.id === primaryBillingRoomId)) {
        setPrimaryBillingRoomId(undefined);
    }

    const newAssignments = { ...groupAssignments };
    newSelectedRooms.forEach(r => {
        if (!newAssignments[r.id]) {
            const category = roomCategories.find(c => c.name === r.type);
            newAssignments[r.id] = { ...newAssignments[r.id], roomCharge: category?.basePrice || '' };
        }
    });
    Object.keys(newAssignments).forEach(roomId => {
        if (!newSelectedRooms.some(r => r.id === roomId)) {
            delete newAssignments[roomId];
        }
    });

    setGroupAssignments(newAssignments);
  }
  
  const handleAssignmentChange = (roomId: string, field: keyof GroupRoomAssignment, value: string) => {
    setGroupAssignments(prev => ({
        ...prev,
        [roomId]: {
            ...prev[roomId],
            [field]: field === 'roomCharge' ? (value === '' ? '' : Number(value)) : value
        }
    }));
  }
  
  const handleApplyDiscount = (roomId: string, discount: number) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    const category = roomCategories.find(c => c.name === room.type);
    const basePrice = category?.basePrice;
    
    if (basePrice) {
        const discountedPrice = basePrice * (1 - discount / 100);
        handleAssignmentChange(roomId, 'roomCharge', discountedPrice.toFixed(2));
    } else {
        toast({
            variant: 'destructive',
            title: 'Base Price Missing',
            description: `Set a base price for the "${room.type}" category to apply discounts.`,
        })
    }
  }

  const handleDownloadTemplate = () => {
    if (availableRooms.length === 0) {
      toast({
        variant: "destructive",
        title: "No Available Rooms",
        description: "There are no rooms available for the selected dates to generate a template.",
      });
      return;
    }

    const headers = ['room_number', 'room_type', 'base_price', 'guest_name', 'guest_number', 'room_charge'];
    const csvData = availableRooms.map(room => {
      const category = roomCategories.find(c => c.name === room.type);
      return {
        room_number: room.number,
        room_type: room.type,
        base_price: category?.basePrice || 0,
        guest_name: '',
        guest_number: '',
        room_charge: category?.basePrice || '',
      };
    });

    const csv = Papa.unparse(csvData, { header: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `group_booking_template_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Template Downloaded",
      description: "A CSV template with available rooms has been downloaded.",
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse<CsvRow>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
            const { data, errors } = results;

            if (errors.length > 0) {
                toast({
                    variant: "destructive",
                    title: "CSV Parsing Error",
                    description: `Error on row ${errors[0].row}: ${errors[0].message}`,
                });
                return;
            }

            const newSelectedRooms: Room[] = [];
            const newAssignments: Record<string, Partial<GroupRoomAssignment>> = {};
            let unavailableCount = 0;

            data.forEach(row => {
                const room = availableRooms.find(r => r.number === row.room_number);
                if (room) {
                    newSelectedRooms.push(room);
                    newAssignments[room.id] = {
                        guestName: row.guest_name,
                        guestNumber: row.guest_number || '',
                        roomCharge: row.room_charge ? Number(row.room_charge) : (roomCategories.find(c => c.name === room.type)?.basePrice || ''),
                    };
                } else {
                    unavailableCount++;
                }
            });

            setSelectedRooms(newSelectedRooms);
            setGroupAssignments(newAssignments);
            toast({
                title: "CSV Processed",
                description: `${newSelectedRooms.length} rooms added to booking. ${unavailableCount > 0 ? `${unavailableCount} rooms were unavailable or not found.` : ''}`,
            });
        },
        error: (error) => {
            toast({
                variant: "destructive",
                title: "File Read Error",
                description: error.message,
            });
        }
    });

    // Reset file input
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };


  const nights = date?.from && date?.to ? differenceInCalendarDays(date.to, date.from) : 0;
  
  const totalCost = useMemo(() => {
    return selectedRooms.reduce((total, room) => {
        const charge = Number(groupAssignments[room.id]?.roomCharge) || 0;
        return total + (charge * nights);
    }, 0);
  }, [selectedRooms, groupAssignments, nights]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Booking Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Booking Type</Label>
                        <RadioGroup value={bookingType} onValueChange={(v) => handleBookingTypeChange(v as BookingType)} className="flex gap-4">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="single" id="single" />
                                <Label htmlFor="single">Single Booking</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="group" id="group" />
                                <Label htmlFor="group">Group Booking</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="guest-name">{bookingType === 'group' ? 'Group/Primary Contact Name' : 'Guest Name'}</Label>
                        <Input id="guest-name" value={primaryGuestName} onChange={(e) => setPrimaryGuestName(e.target.value)} placeholder={bookingType === 'group' ? "e.g., Acme Corp Conference" : "John Doe"} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="guest-number">{bookingType === 'group' ? 'Primary Contact Number' : 'Guest Phone Number'}</Label>
                        <Input id="guest-number" value={primaryGuestNumber} onChange={(e) => setPrimaryGuestNumber(e.target.value)} placeholder="+1 123 456 7890" />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Room Selection</CardTitle>
                </CardHeader>
                 <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Stay Dates ({nights} {nights === 1 ? 'night' : 'nights'})</Label>
                        <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                        <PopoverTrigger asChild>
                            <Button id="date" variant={"outline"} className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                <span className="truncate">{date?.from ? (date.to ? (<>{format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}</>) : (format(date.from, "LLL dd, y"))) : (<span>Pick a date range</span>)}</span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={1} disabled={{ before: startOfDay(new Date()) }} />
                            <div className="p-2 border-t"><Button onClick={() => setIsDatePickerOpen(false)} className="w-full">Done</Button></div>
                        </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2">
                        <Label>Available Rooms ({availableRooms.length})</Label>
                        <div className="flex gap-2">
                            <Popover open={isRoomPickerOpen} onOpenChange={setIsRoomPickerOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start">
                                        <PlusCircle className="mr-2" />
                                        {selectedRooms.length > 0 ? `${selectedRooms.length} room(s) selected` : "Select rooms..."}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search room type..." />
                                        <ScrollArea className="h-48">
                                            <CommandList>
                                                <CommandEmpty>No rooms available for these dates.</CommandEmpty>
                                                <CommandGroup>
                                                    {availableRooms.map(room => (
                                                        <CommandItem key={room.id} onSelect={() => handleRoomSelect(room, !selectedRooms.some(r => r.id === room.id))}>
                                                            <Checkbox className="mr-2" checked={selectedRooms.some(r => r.id === room.id)} onCheckedChange={checked => handleRoomSelect(room, !!checked)} />
                                                            <span>Room {room.number} ({room.type})</span>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </ScrollArea>
                                    </Command>
                                    <div className="p-2 border-t"><Button onClick={() => setIsRoomPickerOpen(false)} className="w-full">Done</Button></div>
                                </PopoverContent>
                            </Popover>
                             {bookingType === 'group' && (
                                <>
                                    <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} />
                                    <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} title="Bulk Upload CSV">
                                        <Upload className="size-4" />
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={handleDownloadTemplate} title="Download CSV Template">
                                        <Download className="size-4" />
                                    </Button>
                                </>
                            )}
                        </div>
                         {bookingType === 'group' && <p className="text-xs text-muted-foreground">CSV format: `room_number,guest_name,...` (header required).</p>}
                    </div>
                </CardContent>
            </Card>
            
            {bookingType === 'group' && selectedRooms.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Billing</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Billing Option</Label>
                            <RadioGroup value={billingOption} onValueChange={(v) => setBillingOption(v as BillingOption)} className="flex gap-4">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="separate" id="separate" />
                                    <Label htmlFor="separate">Keep Bills Separate</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="clubbed" id="clubbed" />
                                    <Label htmlFor="clubbed">Club All Bills</Label>
                                </div>
                            </RadioGroup>
                        </div>
                        {billingOption === 'clubbed' && (
                            <div className="space-y-2 pt-2">
                                <Label htmlFor="primary-room">Primary Billing Room</Label>
                                <Select value={primaryBillingRoomId} onValueChange={setPrimaryBillingRoomId}>
                                    <SelectTrigger id="primary-room"><SelectValue placeholder="Select a primary room..." /></SelectTrigger>
                                    <SelectContent>
                                        {selectedRooms.map(room => (
                                            <SelectItem key={room.id} value={room.id}>
                                                Room {room.number} ({groupAssignments[room.id]?.guestName || 'Unassigned'})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {selectedRooms.length > 0 && (
                 <Card>
                    <CardHeader>
                        <CardTitle>Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Rooms</span><span>{selectedRooms.length}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Nights</span><span>{nights}</span></div>
                        <Separator />
                        <div className="flex justify-between font-bold"><span >Total Est. Room Charge</span><span>{formatPrice(totalCost)}</span></div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleCreateBooking} className="w-full" disabled={selectedRooms.length === 0}>
                            {bookingType === 'group' ? <Users className="mr-2"/> : <User className="mr-2" />}
                            Create {bookingType === 'group' ? `Group Booking (${selectedRooms.length} Rooms)` : 'Booking'}
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>

        {/* Right Column: Room Assignments */}
        <div className="lg:col-span-2">
            {selectedRooms.length > 0 ? (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">{bookingType === 'group' ? 'Room Assignments & Charges' : `Charge for Room ${selectedRooms[0].number}`}</h3>
                    <ScrollArea className="h-[calc(100vh-20rem)]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
                            {selectedRooms.map(room => {
                                const category = roomCategories.find(c => c.name === room.type);
                                const discounts = category?.quickDiscounts || [];
                                const isPrimary = room.id === primaryBillingRoomId;
                                return (
                                <Card key={room.id} className={cn(isPrimary && "border-2 border-primary")}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            {isPrimary && <Star className="size-4 text-primary fill-current"/>}
                                            <Bed className="size-4 text-muted-foreground"/> 
                                            Room {room.number} <span className="text-xs text-muted-foreground">({room.type})</span>
                                            <Button variant="ghost" size="icon" className="ml-auto size-7 text-muted-foreground hover:text-destructive" onClick={() => handleRoomSelect(room, false)}>
                                                <Trash2 className="size-4"/>
                                            </Button>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {bookingType === 'group' && (
                                            <>
                                            <div className="space-y-1">
                                                <Label htmlFor={`guest-name-${room.id}`} className="text-xs">Guest Name</Label>
                                                <Input id={`guest-name-${room.id}`} value={groupAssignments[room.id]?.guestName || ''} onChange={(e) => handleAssignmentChange(room.id, 'guestName', e.target.value)} placeholder="Guest Name"/>
                                            </div>
                                            <div className="space-y-1">
                                                <Label htmlFor={`guest-number-${room.id}`} className="text-xs">Guest Number</Label>
                                                <Input id={`guest-number-${room.id}`} value={groupAssignments[room.id]?.guestNumber || ''} onChange={(e) => handleAssignmentChange(room.id, 'guestNumber', e.target.value)} placeholder="Phone (optional)"/>
                                            </div>
                                            </>
                                        )}

                                        <div className="space-y-1">
                                            <Label htmlFor={`price-${room.id}`} className="text-xs">Price / Night ({currency})</Label>
                                            <div className="relative">
                                                <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                                <Input id={`price-${room.id}`} type="number" value={groupAssignments[room.id]?.roomCharge ?? ''} onChange={(e) => handleAssignmentChange(room.id, 'roomCharge', e.target.value)} placeholder="Price" className="pl-8"/>
                                            </div>
                                        </div>
                                        {discounts.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {discounts.map(discount => (
                                                    <Button key={discount} size="sm" variant="outline" className="h-6 text-xs" onClick={() => handleApplyDiscount(room.id, discount)}>
                                                        {discount}%
                                                    </Button>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )})}
                        </div>
                    </ScrollArea>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-full border rounded-lg p-8">
                    <Bed className="size-16 mb-4" />
                    <h3 className="text-lg font-semibold">No rooms selected</h3>
                    <p className="text-sm">Please select one or more available rooms to proceed with the booking.</p>
                </div>
            )}
        </div>
    </div>
  );
}
