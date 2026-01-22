'use client';

import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { IndianRupee, TrendingUp, BedDouble, LogOut, AreaChart } from 'lucide-react';
import { useSettings } from '@/context/settings-context';
import type { RevenueAnalyticsData, OccupancyAnalyticsData } from './combined-analytics-report';

interface RevenuePageContentProps {
    data: RevenueAnalyticsData;
    occupancyData: OccupancyAnalyticsData;
    todaysDepartures: number;
    expectedRevenue: number;
}

export default function RevenuePageContent({ data, occupancyData, todaysDepartures, expectedRevenue }: RevenuePageContentProps) {
    const { formatPrice } = useSettings();
    const { totalRevenue, roomRevenue, serviceRevenue, adr, chartData } = data;

    const overallOccupancy = useMemo(() => {
        if (!occupancyData?.chartData || occupancyData.chartData.length === 0) return 0;
        const total = occupancyData.chartData.reduce((sum, day) => sum + day.occupancy, 0);
        return total / occupancyData.chartData.length;
    }, [occupancyData]);


    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatPrice(totalRevenue)}</div>
                        <p className="text-xs text-muted-foreground">From all paid bills in the selected range</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Room Revenue</CardTitle>
                        <BedDouble className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatPrice(roomRevenue)}</div>
                        <p className="text-xs text-muted-foreground">Revenue from room charges only</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Service Revenue</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatPrice(serviceRevenue)}</div>
                        <p className="text-xs text-muted-foreground">Revenue from F&B, laundry, etc.</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Daily Rate (ADR)</CardTitle>
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatPrice(adr)}</div>
                        <p className="text-xs text-muted-foreground">Avg. room revenue per occupied room</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Occupancy</CardTitle>
                        <AreaChart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{overallOccupancy.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground">For the selected date range</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Today's Departures</CardTitle>
                        <LogOut className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{todaysDepartures}</div>
                        <p className="text-xs text-muted-foreground">Guests scheduled to check out today</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Expected Revenue Today</CardTitle>
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatPrice(expectedRevenue)}</div>
                        <p className="text-xs text-muted-foreground">From today's scheduled departures</p>
                    </CardContent>
                </Card>
            </div>
             <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue Over Time</CardTitle>
                        <CardDescription>
                            Revenue generated from checkouts within the selected date range.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px] w-full">
                       <div className="flex items-center justify-center h-full text-muted-foreground">Charting library removed for stability.</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Occupancy Over Time</CardTitle>
                        <CardDescription>
                            Hotel occupancy percentage for the selected date range.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px] w-full">
                       <div className="flex items-center justify-center h-full text-muted-foreground">Charting library removed for stability.</div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}