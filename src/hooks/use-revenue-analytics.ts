
'use client';

import { useMemo } from 'react';
import { format, isWithinInterval, startOfMonth, endOfMonth, startOfDay, endOfDay, differenceInCalendarDays, eachDayOfInterval } from 'date-fns';
import type { CorporateClient, CheckedOutStay } from '@/lib/types';
import type { DateRange } from 'react-day-picker';
import { useBilling } from '@/context/billing-context';

export function useRevenueAnalytics(checkoutHistory: CheckedOutStay[], dateRange: DateRange | undefined) {
    const { corporateClients } = useBilling();

    const revenueFromPaidCorporateBills = useMemo(() => {
        if (!corporateClients || !dateRange?.from) return 0;
        const interval = { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to || dateRange.from) };
        let total = 0;
        corporateClients.forEach(client => {
            (client.billedOrders || []).forEach(order => {
                if (order.status === 'Paid' && order.paidDate && isWithinInterval(order.paidDate, interval)) {
                    total += order.amount;
                }
            });
        });
        return total;
    }, [corporateClients, dateRange]);

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

    const revenueAnalyticsData = useMemo(() => {
        if (!dateRange?.from) return { totalRevenue: 0, roomRevenue: 0, serviceRevenue: 0, adr: 0, chartData: [], filterLabel };
        
        const interval = { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to || dateRange.from) };
        
        const relevantStays = checkoutHistory.filter(stay => isWithinInterval(new Date(stay.checkOutDate), interval) && stay.finalBill.total > 0);
        
        const roomRevenue = relevantStays.reduce((sum, stay) => sum + stay.finalBill.roomCharges.amount, 0);
        const serviceRevenue = relevantStays.reduce((sum, stay) => sum + stay.finalBill.serviceCharges.reduce((serviceSum, charge) => serviceSum + (charge.price || 0), 0), 0);
        const totalRevenueFromStays = roomRevenue + serviceRevenue;
        
        const totalRevenue = totalRevenueFromStays + revenueFromPaidCorporateBills;

        const nightsSold = relevantStays.reduce((sum, stay) => sum + (differenceInCalendarDays(new Date(stay.checkOutDate), new Date(stay.checkInDate)) || 1), 0);
        const adr = nightsSold > 0 ? roomRevenue / nightsSold : 0;

        const dailyData = new Map<string, number>();
        eachDayOfInterval(interval).forEach(day => dailyData.set(format(day, 'yyyy-MM-dd'), 0));
        
        relevantStays.forEach(stay => {
            const dayKey = format(new Date(stay.checkOutDate), 'yyyy-MM-dd');
            dailyData.set(dayKey, (dailyData.get(dayKey) || 0) + stay.finalBill.total);
        });

        corporateClients.forEach(client => {
            (client.billedOrders || []).forEach(order => {
                if (order.status === 'Paid' && order.paidDate && isWithinInterval(order.paidDate, interval)) {
                    const dayKey = format(order.paidDate, 'yyyy-MM-dd');
                    dailyData.set(dayKey, (dailyData.get(dayKey) || 0) + order.amount);
                }
            });
        });

        const chartData = Array.from(dailyData.entries()).map(([date, revenue]) => ({ date, revenue })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return { totalRevenue, roomRevenue, serviceRevenue, adr, chartData, filterLabel };
    }, [checkoutHistory, dateRange, filterLabel, revenueFromPaidCorporateBills, corporateClients]);

    return { revenueAnalyticsData };
}
