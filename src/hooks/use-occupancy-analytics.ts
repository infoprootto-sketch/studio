
'use client';

import { useMemo } from 'react';
import { format, startOfDay, eachDayOfInterval, isWithinInterval, subDays } from 'date-fns';
import type { Room } from '@/lib/types';
import type { DateRange } from 'react-day-picker';

export function useOccupancyAnalytics(rooms: Room[], dateRange: DateRange | undefined) {
    const occupancyAnalyticsData = useMemo(() => {
        if (!dateRange?.from || !rooms) return { chartData: [] };
        
        const interval = { start: startOfDay(dateRange.from), end: startOfDay(dateRange.to || dateRange.from) };
        if (!interval.start || !interval.end) return { chartData: [] };
        
        const daysInInterval = eachDayOfInterval(interval);

        const chartData = daysInInterval.map(day => {
            const calculationDate = startOfDay(day);
            const totalRooms = rooms.length;

            if (totalRooms === 0) {
                return { date: format(day, 'yyyy-MM-dd'), occupancy: 0 };
            }

            const occupiedCount = rooms.filter(room => {
                const isBooked = room.stays.some(stay => 
                    isWithinInterval(calculationDate, { start: startOfDay(new Date(stay.checkInDate)), end: subDays(startOfDay(new Date(stay.checkOutDate)), 1) })
                );
                const isOutOfOrder = (room.outOfOrderBlocks || []).some(block => 
                    isWithinInterval(calculationDate, { start: startOfDay(new Date(block.from)), end: startOfDay(new Date(block.to)) })
                );
                return isBooked || isOutOfOrder;
            }).length;

            const occupancyPercentage = totalRooms > 0 ? (occupiedCount / totalRooms) * 100 : 0;
            
            return { date: format(day, 'yyyy-MM-dd'), occupancy: occupancyPercentage };
        });

        return { chartData };
    }, [dateRange, rooms]);

    return { occupancyAnalyticsData };
}
