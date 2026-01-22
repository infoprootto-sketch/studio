

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '../ui/skeleton';
import { useRoomState } from '@/context/room-context';
import type { Room, RoomCategory } from '@/lib/types';
import { format, isWithinInterval, startOfDay, subDays } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';


interface CategoryOccupancyStat {
  categoryName: string;
  occupied: number;
  total: number;
  percentage: number;
  fill: string;
}

const categoryColors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
];

function calculateOccupancyStats(rooms: Room[], roomCategories: RoomCategory[], date: Date): CategoryOccupancyStat[] {
    if (!roomCategories || roomCategories.length === 0) return [];

    const calculationDate = startOfDay(date);

    return roomCategories.map((category, index) => {
        const roomsInCategory = rooms.filter(r => r.type === category.name);
        const totalRoomsInCategory = roomsInCategory.length;

        if (totalRoomsInCategory === 0) {
            return { categoryName: category.name, occupied: 0, total: 0, percentage: 0, fill: categoryColors[index % categoryColors.length] };
        }

        const occupiedCount = roomsInCategory.filter(room => {
            const isOccupiedByCheckedInStay = (room.stays || []).some(stay => {
                if (!stay.checkInDate || !stay.checkOutDate || stay.status !== 'Checked In') return false;
                const checkIn = startOfDay(new Date(stay.checkInDate));
                const checkOut = startOfDay(new Date(stay.checkOutDate));
                return isWithinInterval(calculationDate, { start: checkIn, end: subDays(checkOut, 1) });
            });

            const isOutOfOrder = (room.outOfOrderBlocks || []).some(block => {
                if (!block.from || !block.to) return false;
                return isWithinInterval(calculationDate, { start: startOfDay(new Date(block.from)), end: startOfDay(new Date(block.to)) });
            });

            return isOccupiedByCheckedInStay || isOutOfOrder;
        }).length;

        return {
            categoryName: category.name,
            occupied: occupiedCount,
            total: totalRoomsInCategory,
            percentage: totalRoomsInCategory > 0 ? (occupiedCount / totalRoomsInCategory) * 100 : 0,
            fill: categoryColors[index % categoryColors.length],
        };
    });
}


function OccupancySkeleton() {
    return (
        <div className="space-y-6">
            <div>
                <div className="flex justify-between items-baseline mb-2">
                    <Skeleton className="h-7 w-1/3" />
                    <Skeleton className="h-8 w-1/4" />
                </div>
                <Skeleton className="h-3 w-full" />
            </div>
            <Separator />
            <div>
                <Skeleton className="h-6 w-1/4 mb-4" />
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="space-y-2">
                            <div className="flex justify-between">
                                <Skeleton className="h-4 w-1/3" />
                                <Skeleton className="h-3 w-1/6" />
                            </div>
                            <Skeleton className="h-2 w-full" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export function OccupancyCheck() {
  const { rooms, roomCategories } = useRoomState();
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [isClient, setIsClient] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  useEffect(() => {
    // This effect runs only on the client, after hydration
    setDate(new Date());
    setIsClient(true);
  }, []);

  const statsByCategory = useMemo(() => {
    if (!date || !isClient) return [];
    return calculateOccupancyStats(rooms, roomCategories, date);
  }, [rooms, roomCategories, date, isClient]);

  const overallStats = useMemo(() => {
    if (statsByCategory.length === 0) {
      return { occupied: 0, total: 0, percentage: 0 };
    }
    const totalOccupied = statsByCategory.reduce((sum, stat) => sum + stat.occupied, 0);
    const totalRooms = statsByCategory.reduce((sum, stat) => sum + stat.total, 0);
    return {
      occupied: totalOccupied,
      total: totalRooms,
      percentage: totalRooms > 0 ? (totalOccupied / totalRooms) * 100 : 0,
    };
  }, [statsByCategory]);


  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
                <CardTitle>Occupancy Check</CardTitle>
                <CardDescription>Select a date to check occupancy statistics for your hotel.</CardDescription>
            </div>
             {isClient && date ? (
                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "w-full sm:w-[280px] justify-start text-left font-normal",
                                !date && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={(newDate) => {
                                setDate(newDate || new Date());
                                setIsPopoverOpen(false);
                            }}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            ) : (
                 <Skeleton className="h-10 w-full sm:w-[280px]" />
            )}
        </div>
      </CardHeader>
       <CardContent className="pt-2">
            {isClient ? (
                (rooms.length > 0 && roomCategories.length > 0) ? (
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between items-baseline mb-2">
                                <h3 className="font-semibold text-lg">Overall Occupancy</h3>
                                <p className="text-2xl font-bold font-mono tracking-tight">
                                    {overallStats.percentage.toFixed(0)}%
                                    <span className="text-sm font-normal text-muted-foreground ml-2">
                                        ({overallStats.occupied}/{overallStats.total})
                                    </span>
                                </p>
                            </div>
                            <Progress value={overallStats.percentage} className="h-3" />
                        </div>
                        <Separator />
                        <div>
                            <h4 className="font-semibold mb-4">By Category</h4>
                            <ScrollArea className="h-40">
                                <div className="space-y-4 pr-4">
                                    {statsByCategory.map((stat) => (
                                        stat.total > 0 && (
                                            <div key={stat.categoryName}>
                                                <div className="flex justify-between items-center mb-1 text-sm">
                                                    <span className="font-medium text-muted-foreground">{stat.categoryName}</span>
                                                    <span className="font-mono text-xs">{stat.occupied} / {stat.total}</span>
                                                </div>
                                                <Progress value={stat.percentage} indicatorStyle={{ backgroundColor: stat.fill }} className="h-2" />
                                            </div>
                                        )
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-4 text-muted-foreground">
                        No rooms or categories found.
                    </div>
                )
            ) : (
                <OccupancySkeleton />
            )}
        </CardContent>
    </Card>
  );
}
