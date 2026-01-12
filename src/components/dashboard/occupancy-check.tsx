
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '../ui/skeleton';
import { useRooms } from '@/context/room-context';
import type { Room, RoomCategory } from '@/lib/types';
import { format, isWithinInterval, startOfDay, subDays } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  PolarGrid,
  RadialBar,
  RadialBarChart,
} from "recharts"


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
            const isOccupiedByStay = (room.stays || []).some(stay => {
                if (!stay.checkInDate || !stay.checkOutDate) return false;
                const checkIn = startOfDay(new Date(stay.checkInDate));
                const checkOut = startOfDay(new Date(stay.checkOutDate));
                return isWithinInterval(calculationDate, { start: checkIn, end: subDays(checkOut, 1) });
            });

            const isOutOfOrder = (room.outOfOrderBlocks || []).some(block => {
                if (!block.from || !block.to) return false;
                return isWithinInterval(calculationDate, { start: startOfDay(new Date(block.from)), end: startOfDay(new Date(block.to)) });
            });

            return isOccupiedByStay || isOutOfOrder;
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pt-2">
            {[...Array(3)].map((_, i) => (
                 <div key={i} className="flex flex-col items-center gap-2">
                    <Skeleton className="h-24 w-24 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-12" />
                </div>
            ))}
        </div>
    )
}

export function OccupancyCheck() {
  const { rooms, roomCategories } = useRooms();
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
       <CardContent className="space-y-4">
            <div className="pt-2">
                {isClient ? (
                    (rooms.length > 0 && roomCategories.length > 0) ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {statsByCategory.map(stat => (
                                stat.total > 0 && (
                                    <div key={stat.categoryName} className="flex flex-col items-center gap-1">
                                         <ChartContainer
                                            config={{
                                                percentage: {
                                                    label: "Occupancy",
                                                    color: stat.fill,
                                                },
                                            }}
                                            className="mx-auto aspect-square h-24"
                                            >
                                            <RadialBarChart
                                                data={[{ name: 'occupied', value: stat.percentage, fill: stat.fill }]}
                                                startAngle={90}
                                                endAngle={-270}
                                                innerRadius="70%"
                                                outerRadius="100%"
                                                barSize={8}
                                            >
                                                <PolarGrid gridType="circle" radialLines={false} stroke="none" />
                                                <RadialBar dataKey="value" background cornerRadius={5} />
                                                <ChartTooltip
                                                    cursor={false}
                                                    content={
                                                        <ChartTooltipContent
                                                            hideLabel
                                                            formatter={(value) => `${value.toFixed(0)}% Occupied`}
                                                        />
                                                    }
                                                />
                                            </RadialBarChart>
                                        </ChartContainer>
                                        <p className="font-semibold text-sm">{stat.categoryName}</p>
                                        <p className="text-xs text-muted-foreground">{stat.occupied} / {stat.total} occupied</p>
                                    </div>
                                )
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-4 text-muted-foreground">
                            No rooms or categories found.
                        </div>
                    )
                 ) : (
                    <OccupancySkeleton />
                 )}
             </div>
        </CardContent>
    </Card>
  );
}
