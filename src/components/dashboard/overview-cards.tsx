
'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BedDouble, Check, XCircle, Clock, Wind, CalendarCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Room } from '@/lib/types';
import { useRoomState } from '@/context/room-context';
import Link from 'next/link';
import { useHotelId } from '@/context/hotel-id-context';

const statusConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string; href?: string; }> = {
    Available: { icon: Check, color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/20" },
    Occupied: { icon: BedDouble, color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/20", href: 'live-activity?tab=live-stays' },
    Reserved: { icon: CalendarCheck, color: "text-purple-600", bgColor: "bg-purple-100 dark:bg-purple-900/20" },
    'Waiting for Check-in': { icon: Clock, color: "text-orange-600", bgColor: "bg-orange-100 dark:bg-orange-900/20" },
    Cleaning: { icon: Wind, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/20" },
    'Out of Order': { icon: XCircle, color: "text-gray-600", bgColor: "bg-gray-200 dark:bg-gray-700/50" },
};


export function OverviewCards({ rooms: initialRooms }: { rooms: Room[] }) {
    const { rooms: contextRooms } = useRoomState();
    const rooms = initialRooms && initialRooms.length > 0 ? initialRooms : contextRooms;
    const hotelId = useHotelId();

    const stats = useMemo(() => {
        if (!rooms) return { totalRooms: 0, available: 0, occupied: 0, reserved: 0, waiting: 0, cleaning: 0, outOfOrder: 0 };
        return {
            totalRooms: rooms.length,
            available: rooms.filter(r => r.displayStatus === 'Available').length,
            occupied: rooms.filter(r => r.displayStatus === 'Occupied').length,
            reserved: rooms.filter(r => r.displayStatus === 'Reserved').length,
            waiting: rooms.filter(r => r.displayStatus === 'Waiting for Check-in').length,
            cleaning: rooms.filter(r => r.displayStatus === 'Cleaning').length,
            outOfOrder: rooms.filter(r => r.displayStatus === 'Out of Order').length,
        };
    }, [rooms]);

    const overviewData = [
        { title: 'Total Rooms', value: stats.totalRooms, icon: BedDouble, color: "text-primary", bgColor: "bg-primary/10", href: `/${hotelId}/dashboard/rooms` },
        { title: 'Available', value: stats.available, ...statusConfig['Available'], href: `/${hotelId}/dashboard/reservations` },
        { title: 'Occupied', value: stats.occupied, ...statusConfig['Occupied'], href: `/${hotelId}/dashboard/live-activity?tab=live-stays` },
        { title: 'Reserved', value: stats.reserved, ...statusConfig['Reserved'] },
        { title: 'Waiting for Check-in', value: stats.waiting, ...statusConfig['Waiting for Check-in'] },
        { title: 'Cleaning', value: stats.cleaning, ...statusConfig['Cleaning'] },
        { title: 'Out of Order', value: stats.outOfOrder, ...statusConfig['Out of Order'] },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-4 md:gap-8 lg:grid-cols-7">
            {overviewData.map((item) => {
                const cardContent = (
                    <Card className="hover:shadow-lg transition-shadow duration-300 h-full">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{item.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center justify-between">
                            <div className="text-3xl font-bold">{item.value}</div>
                            <div className={cn("flex items-center justify-center rounded-full h-10 w-10", item.bgColor)}>
                               <item.icon className={cn("h-5 w-5", item.color)} />
                            </div>
                        </CardContent>
                    </Card>
                );
                
                if (item.href) {
                    return (
                        <Link href={item.href} key={item.title} className="hover:scale-105 transition-transform duration-300">
                           {cardContent}
                        </Link>
                    )
                }
                
                return (
                     <div key={item.title} className="cursor-default">
                        {cardContent}
                     </div>
                )
            })}
        </div>
    );
}
