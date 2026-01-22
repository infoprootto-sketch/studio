
'use client';

import { useMemo } from 'react';
import { format, startOfDay, eachDayOfInterval, isWithinInterval, subDays, startOfMonth, endOfMonth } from 'date-fns';
import type { Room } from '@/lib/types';
import type { DateRange } from 'react-day-picker';

export function useOccupancyAnalytics(rooms: Room[], dateRange: DateRange | undefined) {
    
    const filterLabel = useMemo(() => {
      if (!dateRange?.from) return "Select a date range";
      if (dateRange.to) {
        if (format(dateRange.from, 'yyyy-MM-dd') === format(startOfMonth(dateRange.from), 'yyyy-MM-dd') && format(dateRange.to, 'yyyy-MM-dd') === format(endOfMonth(dateRange.from), 'yyyy-MM-dd')) {
            return format(dateRange.from, 'MMMM yyyy');
        }
        return `${format(dateRange.from, 'LLL dd, yyyy')} - ${format(dateRange.to, 'LLL dd, yyyy')}`;
      }
      return format(dateRange.from, 'LLL dd, yyyy');
    }, [dateRange]);
    
    const occupancyAnalyticsData = useMemo(() => {
        if (!dateRange?.from || !rooms) return { chartData: [], filterLabel };
        
        const interval = { start: startOfDay(dateRange.from), end: startOfDay(dateRange.to || dateRange.from) };
        if (!interval.start || !interval.end) return { chartData: [], filterLabel };
        
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

        return { chartData, filterLabel };
    }, [dateRange, rooms, filterLabel]);

    return { occupancyAnalyticsData };
}
