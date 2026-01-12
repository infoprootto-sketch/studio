
'use client'

import { useState, useMemo, useEffect, useRef } from 'react';
import { addDays, format, isWithinInterval, startOfDay, eachDayOfInterval, subDays, isToday, isSameDay, startOfWeek, endOfWeek, addWeeks, subWeeks, isBefore } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Room, RoomStatus, Stay, CheckedOutStay } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useRooms } from '@/context/room-context';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, PlusCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { StayHistoryDialog } from './stay-history-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useRouter } from 'next/navigation';
import { useHotelId } from '@/context/hotel-id-context';


const statusColors: Record<string, string> = {
    Available: "bg-green-100 dark:bg-green-900/50 hover:bg-green-200 dark:hover:bg-green-900",
    Reserved: "bg-purple-600/80",
    'Waiting for Check-in': "bg-orange-500",
    Occupied: "bg-red-500",
    'Cleaning': "bg-blue-500",
    'Out of Order': "bg-gray-500",
    'Past Occupancy': "bg-gray-300 dark:bg-gray-700",
};

type DayStatus = RoomStatus | 'Available' | 'Past Occupancy';


const DayCell = ({ date, room, checkedOutStays, onCellClick }: { date: Date; room: Room; checkedOutStays: CheckedOutStay[], onCellClick: (room: Room, date: Date, stay?: Stay, action?: 'clean' | 'out-of-order', pastStay?: CheckedOutStay) => void; }) => {
    let tooltipContent = `Room ${room.number} is available on ${format(date, 'MMM d')}`;
    let cellStatus: DayStatus = 'Available';
    let stay: Stay | undefined = undefined;
    let pastStay: CheckedOutStay | undefined = undefined;
    let action: 'clean' | 'out-of-order' | undefined = undefined;

    const dayStart = startOfDay(date);
    const isPastDate = isBefore(dayStart, startOfDay(new Date()));

    if (isPastDate) {
        pastStay = checkedOutStays.find(s => {
            const checkIn = startOfDay(new Date(s.checkInDate));
            const checkOut = startOfDay(new Date(s.checkOutDate));
            return s.roomNumber === room.number && isWithinInterval(dayStart, { start: checkIn, end: subDays(checkOut, 1) });
        });
        
        if (pastStay) {
            cellStatus = 'Past Occupancy';
            tooltipContent = `Stay of ${pastStay.guestName} (Checked out)`;
        } else {
            cellStatus = 'Available';
            tooltipContent = `Room ${room.number} was available on ${format(date, 'MMM d')}`;
        }
    } else {
        // Future or today's logic
        if (room.outOfOrderBlocks?.some(block => isWithinInterval(dayStart, { start: startOfDay(block.from), end: subDays(startOfDay(block.to), 1) }))) {
            action = 'out-of-order';
            cellStatus = 'Out of Order';
            tooltipContent = `Room ${room.number} is out of order.`;
        } 
        else if (room.status === 'Cleaning' && room.checkOutDate && isSameDay(dayStart, startOfDay(new Date(room.checkOutDate)))) {
            action = 'clean';
            cellStatus = 'Cleaning';
            tooltipContent = `Room ${room.number} is being cleaned. Click to mark as available.`;
        } else {
            for (const s of room.stays) {
              const bookingInterval = { start: startOfDay(new Date(s.checkInDate)), end: subDays(startOfDay(new Date(s.checkOutDate)), 1) };
               if (isWithinInterval(dayStart, bookingInterval)) {
                  stay = s;
                  tooltipContent = `Booked by ${s.guestName} from ${format(new Date(s.checkInDate), 'MMM d')} to ${format(new Date(s.checkOutDate), 'MMM d')}`;
                  
                  if (room.stayId === s.stayId && room.status === 'Occupied') {
                      cellStatus = 'Occupied';
                  } else if (isToday(bookingInterval.start) && isSameDay(dayStart, bookingInterval.start)) {
                     cellStatus = 'Waiting for Check-in';
                  } else {
                     cellStatus = 'Reserved';
                  }
                  break;
              }
            }
        }
    }
    
    const cellStatusColor = statusColors[cellStatus] || statusColors['Reserved'];
    const isClickable = !isPastDate || !!pastStay;
    const cursorClass = isClickable ? 'cursor-pointer' : 'cursor-not-allowed';

    const handleClick = () => {
      if (isClickable) {
        onCellClick(room, date, stay, action, pastStay);
      }
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className={cn("h-8 w-full rounded-sm", cellStatusColor, cursorClass)} onClick={handleClick} />
                </TooltipTrigger>
                <TooltipContent>
                    <p>{tooltipContent}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}


export function RoomAvailabilityGrid() {
    const { rooms, openManageRoom, checkoutHistory, roomCategories } = useRooms();
    const router = useRouter();
    const hotelId = useHotelId();
    const [startDate, setStartDate] = useState(new Date());
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [selectedPastStay, setSelectedPastStay] = useState<CheckedOutStay | null>(null);
    const [numberOfDays, setNumberOfDays] = useState(15);
    const [isAnyFilterActive, setIsAnyFilterActive] = useState(false);

    const dates = eachDayOfInterval({
        start: startDate,
        end: addDays(startDate, numberOfDays - 1)
    });

    const filteredRooms = useMemo(() => {
        const anyFilter = searchQuery !== '' || categoryFilter !== 'All';
        setIsAnyFilterActive(anyFilter);

        if (!anyFilter) {
            return [];
        }

        return rooms.filter(room => {
            const searchMatch = !searchQuery || room.number.includes(searchQuery);
            const categoryMatch = categoryFilter === 'All' || room.type === categoryFilter;
            
            if (searchQuery && categoryFilter === 'All') {
                return searchMatch;
            }
            if (!searchQuery && categoryFilter !== 'All') {
                return categoryMatch;
            }

            return searchMatch && categoryMatch;
        });
    }, [rooms, searchQuery, categoryFilter]);

    const handleCellClick = (room: Room, date: Date, stay?: Stay, action?: 'clean' | 'out-of-order', pastStay?: CheckedOutStay) => {
      if (pastStay) {
        setSelectedPastStay(pastStay);
      } else if (!stay && !action) {
        // If the cell is empty (no stay, no action), redirect to the create booking page
        router.push(`/${hotelId}/dashboard/reservations/create-booking`);
      }
      else {
        openManageRoom(room, stay?.stayId, date, action);
      }
    }
    
    const handleCloseHistoryDialog = () => {
        setSelectedPastStay(null);
    }

    return (
      <>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button variant="outline" size="icon" onClick={() => setStartDate(subDays(startDate, 7))}>
                    <ChevronLeft />
                </Button>
                <div className="font-bold text-lg w-48 text-center hidden sm:block">
                    {format(startDate, 'MMM d, yyyy')}
                </div>
                 <Button variant="outline" size="icon" onClick={() => setStartDate(addDays(startDate, 7))}>
                    <ChevronRight />
                </Button>
                 <Button variant="outline" className="hidden sm:inline-flex" onClick={() => setStartDate(new Date())}>Today</Button>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Select a category..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Categories</SelectItem>
                        {roomCategories.map(cat => (
                            <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search room number..."
                        className="pl-8 w-full"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
        </div>
        <ScrollArea className="border rounded-lg whitespace-nowrap">
            <Table>
                <TableHeader className="sticky top-0 bg-background z-20">
                    <TableRow>
                        <TableHead className="w-[100px] min-w-[100px] font-bold text-foreground dark:text-foreground sticky left-0 bg-background z-30">Room</TableHead>
                        {dates.map((date, index) => {
                            const isNewMonth = date.getDate() === 1;
                            return (
                                <TableHead key={date.toISOString()} className={cn("text-center w-10 p-2 min-w-[40px]", isNewMonth && "border-l")}>
                                    <div className={cn("flex flex-col items-center", isToday(date) && "text-primary")}>
                                        {isNewMonth && <span className="text-xs font-bold text-primary">{format(date, 'MMM')}</span>}
                                        <span className="text-xs font-normal text-muted-foreground">{format(date, 'E')}</span>
                                        <span className="font-bold">{format(date, 'd')}</span>
                                    </div>
                                </TableHead>
                            )
                        })}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isAnyFilterActive && filteredRooms.map(room => (
                        <TableRow key={room.id}>
                            <TableCell className="font-medium sticky left-0 bg-background z-10 min-w-[100px]">
                                <div className="font-bold">{room.number}</div>
                                <div className="text-xs text-muted-foreground">{room.type}</div>
                            </TableCell>
                            {dates.map(date => {
                                const isNewMonth = date.getDate() === 1;
                                return (
                                    <TableCell key={date.toISOString()} className={cn("p-1 min-w-[40px]", isNewMonth && "border-l")}>
                                        <DayCell date={date} room={room} checkedOutStays={checkoutHistory} onCellClick={handleCellClick} />
                                    </TableCell>
                                )
                            })}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            {!isAnyFilterActive ? (
                <div className="text-center p-8 text-muted-foreground">
                    Please select a room category or use the search to view availability.
                </div>
            ) : filteredRooms.length === 0 ? (
                 <div className="text-center p-8 text-muted-foreground">
                    No rooms found for the selected filters.
                </div>
            ) : null}
             <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <StayHistoryDialog
            stay={selectedPastStay}
            isOpen={!!selectedPastStay}
            onClose={handleCloseHistoryDialog}
        />
      </>
    );
}
