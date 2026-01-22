
'use client';

import { useMemo } from 'react';
import { isWithinInterval, startOfDay, endOfDay, format, startOfMonth, endOfMonth } from 'date-fns';
import type { ServiceRequest, CheckedOutStay, Restaurant } from '@/lib/types';
import type { DateRange } from 'react-day-picker';

export function useServiceAnalytics(
    serviceRequests: ServiceRequest[], 
    checkoutHistory: CheckedOutStay[], 
    dateRange: DateRange | undefined,
    restaurants: Restaurant[]
) {
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

    const serviceAnalyticsData = useMemo(() => {
        if (!dateRange?.from) return { totalServiceRevenue: 0, mostRequestedService: null, topRevenueService: null, serviceAnalytics: [], categoryAnalytics: [], filterLabel };

        const interval = { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to || dateRange.from) };
        
        const servicesInRange = [
            ...checkoutHistory.filter(stay => isWithinInterval(new Date(stay.checkOutDate), interval)).flatMap(stay => stay.finalBill.serviceCharges),
            ...serviceRequests.filter(req => isWithinInterval(new Date(req.creationTime), interval))
        ];

        const analyticsMap = new Map<string, { requests: number, revenue: number, category: string }>();
        servicesInRange.forEach(service => {
            const serviceName = service.service.replace(/ \(x\d+\)$/, '').trim();
            const existing = analyticsMap.get(serviceName);

            let displayCategory = service.category || 'Other';
            if ((service as any).restaurantId) {
                const restaurant = restaurants.find(r => r.id === (service as any).restaurantId);
                if (restaurant) {
                    displayCategory = restaurant.name;
                }
            }

            if (existing) {
                analyticsMap.set(serviceName, {
                    ...existing,
                    requests: existing.requests + (service.quantity || 1),
                    revenue: existing.revenue + (service.price || 0),
                });
            } else {
                analyticsMap.set(serviceName, { requests: service.quantity || 1, revenue: service.price || 0, category: displayCategory });
            }
        });
        const serviceAnalytics = Array.from(analyticsMap.entries()).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.revenue - a.revenue);

        const categoryMap = new Map<string, number>();
        serviceAnalytics.forEach(service => {
            const category = service.category || 'Other';
            categoryMap.set(category, (categoryMap.get(category) || 0) + service.revenue);
        });

        const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8442ff", "#ff42c9", "#a4de6c", "#d0ed57", "#ffc658"];
        const categoryAnalytics = Array.from(categoryMap.entries())
            .map(([name, revenue], index) => ({ name, revenue, fill: COLORS[index % COLORS.length] }))
            .sort((a, b) => b.revenue - a.revenue);
        
        const userFacingServices = serviceAnalytics.filter(s => s.name !== 'Post-Checkout Cleaning');

        const mostRequestedService = [...userFacingServices].sort((a, b) => b.requests - a.requests)[0] || null;
        const topRevenueService = userFacingServices[0] || null;
        const totalServiceRevenue = serviceAnalytics.reduce((sum, service) => sum + service.revenue, 0);

        return { totalServiceRevenue, mostRequestedService, topRevenueService, serviceAnalytics, categoryAnalytics, filterLabel };
    }, [serviceRequests, checkoutHistory, dateRange, restaurants, filterLabel]);

    return { serviceAnalyticsData };
}
