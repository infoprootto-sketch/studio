'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSettings } from '@/context/settings-context';
import { TrendingUp, Zap, Star } from 'lucide-react';
import type { ServiceAnalyticsData } from './combined-analytics-report';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface AnalyticsPageContentProps {
    data: ServiceAnalyticsData;
}

export default function AnalyticsPageContent({ data }: AnalyticsPageContentProps) {
    const { formatPrice } = useSettings();
    const { totalServiceRevenue, mostRequestedService, topRevenueService, serviceAnalytics, categoryAnalytics } = data;
    const [categoryFilter, setCategoryFilter] = useState('all');

    const filteredServiceAnalytics = useMemo(() => {
        if (categoryFilter === 'all') {
            return serviceAnalytics;
        }
        return serviceAnalytics.filter(service => service.category === categoryFilter);
    }, [serviceAnalytics, categoryFilter]);

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Service Revenue</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatPrice(totalServiceRevenue)}</div>
                        <p className="text-xs text-muted-foreground">From {serviceAnalytics.reduce((p,c) => p + c.requests, 0)} service requests</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Most Popular Service</CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold truncate">{mostRequestedService?.name || 'N/A'}</div>
                        <p className="text-xs text-muted-foreground">{mostRequestedService ? `${mostRequestedService.requests} requests` : ''}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Top Revenue Service</CardTitle>
                        <Star className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold truncate">{topRevenueService?.name || 'N/A'}</div>
                        <p className="text-xs text-muted-foreground">{topRevenueService ? `${formatPrice(topRevenueService.revenue)} generated` : ''}</p>
                    </CardContent>
                </Card>
            </div>
             
             <Card>
                <CardHeader>
                    <CardTitle>Revenue by Category</CardTitle>
                    <CardDescription>A breakdown of where your service revenue comes from.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div className="min-h-[300px] w-full flex items-center justify-center text-muted-foreground">
                            Chart removed for stability.
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Category</TableHead>
                                    <TableHead className="text-right">Revenue</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categoryAnalytics.map(cat => (
                                    <TableRow key={cat.name}>
                                        <TableCell className="font-medium">{cat.name}</TableCell>
                                        <TableCell className="text-right font-mono">{formatPrice(cat.revenue)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-2">
                        <div>
                            <CardTitle>Itemized Service Analytics</CardTitle>
                            <CardDescription>Detailed breakdown of all services rendered across all stays (active and past).</CardDescription>
                        </div>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-full md:w-[240px]">
                                <SelectValue placeholder="Select a category to view..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {(categoryAnalytics || []).map(cat => (
                                    <SelectItem key={cat.name} value={cat.name}>{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                {categoryFilter !== 'all' ? (
                    <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Service Name</TableHead>
                                    <TableHead className="text-center">Total Requests</TableHead>
                                    <TableHead className="text-right">Avg. Price per Request</TableHead>
                                    <TableHead className="text-right">Total Revenue</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredServiceAnalytics.length > 0 ? (
                                    filteredServiceAnalytics.map(service => (
                                        <TableRow key={service.name}>
                                            <TableCell className="font-medium">{service.name}</TableCell>
                                            <TableCell className="text-center">{service.requests}</TableCell>
                                            <TableCell className="text-right font-mono">{service.requests > 0 ? formatPrice(service.revenue / service.requests) : formatPrice(0)}</TableCell>
                                            <TableCell className="text-right font-mono font-bold">{formatPrice(service.revenue)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            No itemized service data for the selected category and period.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>Select a category to view itemized service analytics.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
