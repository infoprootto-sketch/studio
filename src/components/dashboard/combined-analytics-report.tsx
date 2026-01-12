

'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, TrendingUp, BedDouble, Zap, Star } from 'lucide-react';
import { useSettings } from '@/context/settings-context';
import { RevenueChart, type ChartDataPoint } from './revenue-chart';
import { Logo } from '../logo';
import { ResponsiveContainer, PieChart, Pie, Cell, Bar, BarChart, CartesianGrid, XAxis, YAxis, LabelList } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';

// Data shapes
export interface RevenueAnalyticsData {
    totalRevenue: number;
    roomRevenue: number;
    serviceRevenue: number;
    adr: number;
    chartData: ChartDataPoint[];
    filterLabel: string;
}

export interface ServiceAnalyticsData {
    totalServiceRevenue: number;
    mostRequestedService: { name: string; requests: number } | null;
    topRevenueService: { name: string; revenue: number } | null;
    serviceAnalytics: { name: string; requests: number; revenue: number; category: string; }[];
    categoryAnalytics: { name: string; revenue: number; fill: string }[];
    filterLabel: string;
}

interface CombinedAnalyticsReportProps {
  id: string;
  revenueData: RevenueAnalyticsData;
  serviceData: ServiceAnalyticsData;
}

export function CombinedAnalyticsReport({ id, revenueData, serviceData }: CombinedAnalyticsReportProps) {
  const { formatPrice, legalName } = useSettings();

  const chartConfig: ChartConfig = React.useMemo(() => {
    const config: ChartConfig = {};
    serviceData.categoryAnalytics.forEach(cat => {
        config[cat.name] = { label: cat.name, color: cat.fill };
    });
    return config;
  }, [serviceData.categoryAnalytics]);

  const chartData = React.useMemo(() => {
    return [...serviceData.categoryAnalytics].sort((a, b) => b.revenue - a.revenue);
  }, [serviceData.categoryAnalytics]);

  return (
    <div id={id} className="p-4 bg-white text-black print-container space-y-8">
        {/* Report Header */}
        <div className="flex justify-between items-start border-b pb-4">
            <div>
                <h1 className="text-2xl font-bold">{legalName}</h1>
                <h2 className="text-lg font-semibold text-gray-700">Monthly Performance Report</h2>
                <p className="text-sm text-gray-500">For: {revenueData.filterLabel}</p>
            </div>
            <Logo className="size-12" />
        </div>

        {/* Revenue Section */}
        <section>
            <h2 className="text-xl font-bold mb-4">Revenue Overview</h2>
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="p-4 border rounded-lg">
                    <h3 className="text-xs font-medium text-gray-500">Total Revenue</h3>
                    <div className="text-xl font-bold">{formatPrice(revenueData.totalRevenue)}</div>
                </div>
                <div className="p-4 border rounded-lg">
                    <h3 className="text-xs font-medium text-gray-500">Room Revenue</h3>
                    <div className="text-xl font-bold">{formatPrice(revenueData.roomRevenue)}</div>
                </div>
                <div className="p-4 border rounded-lg">
                    <h3 className="text-xs font-medium text-gray-500">Service Revenue</h3>
                    <div className="text-xl font-bold">{formatPrice(revenueData.serviceRevenue)}</div>
                </div>
                <div className="p-4 border rounded-lg">
                    <h3 className="text-xs font-medium text-gray-500">Avg. Daily Rate (ADR)</h3>
                    <div className="text-xl font-bold">{formatPrice(revenueData.adr)}</div>
                </div>
            </div>
            <div className="p-4 border rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Revenue Over Time</h3>
                <div className="h-[350px] w-full"><RevenueChart data={revenueData.chartData} /></div>
            </div>
        </section>

        {/* Service Analytics Section */}
        <section>
            <h2 className="text-xl font-bold mb-4">Service Analytics</h2>
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 border rounded-lg">
                    <h3 className="text-xs font-medium text-gray-500">Total Service Revenue</h3>
                    <div className="text-xl font-bold">{formatPrice(serviceData.totalServiceRevenue)}</div>
                </div>
                <div className="p-4 border rounded-lg">
                    <h3 className="text-xs font-medium text-gray-500">Most Popular</h3>
                    <div className="text-lg font-bold truncate">{serviceData.mostRequestedService?.name || 'N/A'}</div>
                </div>
                <div className="p-4 border rounded-lg">
                    <h3 className="text-xs font-medium text-gray-500">Top Earner</h3>
                    <div className="text-lg font-bold truncate">{serviceData.topRevenueService?.name || 'N/A'}</div>
                </div>
            </div>
            <div className="p-4 border rounded-lg mb-6">
                <h3 className="text-lg font-semibold mb-2">Revenue by Category</h3>
                <div className="grid grid-cols-2 gap-8 items-center">
                    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                        <ResponsiveContainer width="100%" height={chartData.length * 40}>
                            <BarChart
                                data={chartData}
                                layout="vertical"
                                margin={{
                                    left: 10,
                                    right: 50, 
                                }}
                            >
                                <CartesianGrid horizontal={false} />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    tickLine={false}
                                    tickMargin={5}
                                    axisLine={false}
                                    width={150}
                                    className="text-xs"
                                />
                                <XAxis dataKey="revenue" type="number" hide />
                                <Bar dataKey="revenue" layout="vertical" radius={5} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                    <Table><TableHeader><TableRow><TableHead>Category</TableHead><TableHead className="text-right">Revenue</TableHead></TableRow></TableHeader><TableBody>{serviceData.categoryAnalytics.map(cat => (<TableRow key={cat.name}><TableCell className="font-medium">{cat.name}</TableCell><TableCell className="text-right font-mono">{formatPrice(cat.revenue)}</TableCell></TableRow>))}</TableBody></Table>
                </div>
            </div>
            <div className="p-4 border rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Itemized Service Analytics</h3>
                <Table><TableHeader><TableRow><TableHead>Service</TableHead><TableHead className="text-center">Requests</TableHead><TableHead className="text-right">Revenue</TableHead></TableRow></TableHeader><TableBody>{serviceData.serviceAnalytics.map(service => (<TableRow key={service.name}><TableCell className="font-medium">{service.name}</TableCell><TableCell className="text-center">{service.requests}</TableCell><TableCell className="text-right font-mono font-bold">{formatPrice(service.revenue)}</TableCell></TableRow>))}</TableBody></Table>
            </div>
        </section>
    </div>
  );
}
