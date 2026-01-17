

'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CheckoutHistoryList } from '@/components/dashboard/checkout-history-list';
import { useRooms } from '@/context/room-context';
import { isToday, isThisMonth, isWithinInterval, startOfDay, endOfDay, eachDayOfInterval, differenceInCalendarDays } from 'date-fns';
import { CheckCircle, CalendarDays, IndianRupee, X, AreaChart, BedDouble } from 'lucide-react';
import { useSettings } from '@/context/settings-context';
import type { DateRange } from 'react-day-picker';
import type { ChartDataPoint } from '@/components/dashboard/revenue-chart';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

export default function HistoryPage() {
    const { checkoutHistory } = useRooms();
    const { formatPrice } = useSettings();
    const [isClient, setIsClient] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const checkoutsToday = useMemo(() => {
        if (!isClient) return 0;
        return checkoutHistory.filter(stay => isToday(stay.checkOutDate)).length;
    }, [checkoutHistory, isClient]);

    const checkoutsThisMonth = useMemo(() => {
        if (!isClient) return 0;
        return checkoutHistory.filter(stay => isThisMonth(stay.checkOutDate)).length;
    }, [checkoutHistory, isClient]);

    const filteredStays = useMemo(() => {
        let stays = checkoutHistory;

        // Filter by date range first
        if (dateRange?.from) {
            const toDate = dateRange.to || dateRange.from;
            const interval = { start: startOfDay(dateRange.from), end: endOfDay(toDate) };
            stays = stays.filter(stay => isWithinInterval(stay.checkOutDate, interval));
        }

        // Then filter by search query
        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            stays = stays.filter(stay => 
                stay.guestName.toLowerCase().includes(lowercasedQuery) ||
                stay.stayId.toLowerCase().includes(lowercasedQuery)
            );
        }

        return stays;
    }, [checkoutHistory, searchQuery, dateRange]);

    const filteredRevenue = useMemo(() => {
        return filteredStays.reduce((sum, stay) => sum + stay.finalBill.total, 0);
    }, [filteredStays]);

    const averageRevenuePerStay = useMemo(() => {
        if (filteredStays.length === 0) return 0;
        return filteredRevenue / filteredStays.length;
    }, [filteredRevenue, filteredStays]);
    
    const averageStayDuration = useMemo(() => {
        if (filteredStays.length === 0) return 0;
        const totalNights = filteredStays.reduce((sum, stay) => {
            const nights = differenceInCalendarDays(stay.checkOutDate, stay.checkInDate);
            return sum + (nights > 0 ? nights : 1);
        }, 0);
        return totalNights / filteredStays.length;
    }, [filteredStays]);

    const chartData = useMemo((): ChartDataPoint[] => {
        if (!dateRange?.from) return [];
        
        const interval = { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to || dateRange.from) };
        const dailyData = new Map<string, number>();

        // Initialize all days in the range with 0 revenue
        const daysInInterval = eachDayOfInterval(interval);
        daysInInterval.forEach(day => {
            dailyData.set(format(day, 'yyyy-MM-dd'), 0);
        });

        // Add revenue from checkouts in the filtered stays
        filteredStays.forEach(stay => {
            if (isWithinInterval(stay.checkOutDate, interval)) {
                const dayKey = format(stay.checkOutDate, 'yyyy-MM-dd');
                dailyData.set(dayKey, (dailyData.get(dayKey) || 0) + stay.finalBill.total);
            }
        });

        return Array.from(dailyData.entries())
            .map(([date, revenue]) => ({ date, revenue }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    }, [filteredStays, dateRange]);

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Checkouts Today</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{isClient ? checkoutsToday : '...'}</div>
                        <p className="text-xs text-muted-foreground">Total guests checked out today</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Checkouts This Month</CardTitle>
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{isClient ? checkoutsThisMonth : '...'}</div>
                        <p className="text-xs text-muted-foreground">Total guests checked out this month</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Filtered Revenue</CardTitle>
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatPrice(filteredRevenue)}</div>
                        <p className="text-xs text-muted-foreground">Total from {filteredStays.length} visible checkouts</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Revenue / Stay</CardTitle>
                        <AreaChart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatPrice(averageRevenuePerStay)}</div>
                        <p className="text-xs text-muted-foreground">Average bill for selected checkouts</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Stay Duration</CardTitle>
                        <BedDouble className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{averageStayDuration.toFixed(1)} <span className="text-base font-normal">nights</span></div>
                        <p className="text-xs text-muted-foreground">Average for selected checkouts</p>
                    </CardContent>
                </Card>
            </div>
             {dateRange && (
                <Card>
                    <CardHeader className="flex flex-row justify-between items-start">
                        <div>
                            <CardTitle>Revenue Trend</CardTitle>
                            <CardDescription>
                                Revenue from checkouts in the selected date range.
                            </CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" className=" -mt-2 -mr-2" onClick={() => setDateRange(undefined)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent className="h-[250px] w-full">
                       <RevenueChart data={chartData} />
                    </CardContent>
                </Card>
            )}
            <Card>
                <CardHeader>
                    <CardTitle>Checkout History</CardTitle>
                    <CardDescription>Review details from all past guest stays.</CardDescription>
                </CardHeader>
                <CardContent>
                    <CheckoutHistoryList 
                        checkedOutStays={checkoutHistory} 
                        filteredStays={filteredStays}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        dateRange={dateRange}
                        setDateRange={setDateRange}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
