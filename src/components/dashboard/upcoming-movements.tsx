

'use client';

import React, { useState, useMemo } from 'react';
import { useRoomState, useRoomActions } from '@/context/room-context';
import { ArrowDownCircle, ArrowUpCircle, LogIn, Search, LogOut } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { Room, Stay } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useHotelId } from '@/context/hotel-id-context';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { differenceInCalendarDays } from 'date-fns';

const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return name.substring(0, 2);
};


export function UpcomingMovements() {
  const { 
    todaysArrivals, 
    todaysDepartures, 
  } = useRoomState();
  const { checkInStay } = useRoomActions();
  
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const router = useRouter();
  const hotelId = useHotelId();

  const handleCheckIn = (room: Room, stay: Stay) => {
    checkInStay(room.id, stay.stayId);
    toast({
        title: "Guest Checked In",
        description: `Checked in ${stay.guestName} to Room ${room.number}.`
    });
  }

  const handleDepartureClick = () => {
     router.push(`/${hotelId}/dashboard/live-activity`);
  }

  const combinedMovements = useMemo(() => {
    const arrivals = todaysArrivals.map(m => ({ ...m, type: 'arrival' as const }));
    const departures = todaysDepartures.map(m => ({ ...m, type: 'departure' as const }));
    
    const all = [...arrivals, ...departures];

    if (!searchQuery) return all;

    return all.filter(m => 
        m.stay.guestName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        m.room.number.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [todaysArrivals, todaysDepartures, searchQuery]);

  return (
    <div className="space-y-4">
        <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Search movements..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
        
        {combinedMovements.length > 0 ? (
            <ScrollArea className="h-96">
                <div className="space-y-4 pr-4">
                    {combinedMovements.map(({ room, stay, type }) => {
                        const isArrival = type === 'arrival';
                        const nights = differenceInCalendarDays(new Date(stay.checkOutDate), new Date(stay.checkInDate)) || 1;

                        return (
                            <div key={stay.stayId} className="flex items-center gap-4 p-3 border rounded-lg relative">
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-lg ${isArrival ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <Avatar>
                                    <AvatarFallback>{getInitials(stay.guestName)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="font-semibold">{stay.guestName}</p>
                                    <p className="text-sm text-muted-foreground">
                                        Room {room.number} &middot; {room.type} &middot; {nights} {nights === 1 ? 'night' : 'nights'}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="font-semibold text-sm mb-2">{isArrival ? 'Arrival' : 'Departure'}</span>
                                    {isArrival ? (
                                        <Button size="sm" onClick={() => handleCheckIn(room, stay)}>
                                            <LogIn className="mr-2 h-4 w-4" />
                                            Check In
                                        </Button>
                                    ) : (
                                        <Button size="sm" variant="outline" onClick={handleDepartureClick}>
                                            <LogOut className="mr-2 h-4 w-4" />
                                            Checkout
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </ScrollArea>
        ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center">
                <p className="text-muted-foreground">No upcoming movements for today.</p>
            </div>
        )}
    </div>
  );
}

