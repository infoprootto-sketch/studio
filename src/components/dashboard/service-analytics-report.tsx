
'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSettings } from '@/context/settings-context';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, YAxis, XAxis, CartesianGrid, LabelList } from 'recharts';
import { ChartConfig, ChartContainer } from '../ui/chart';
import { Logo } from '../logo';
import type { ServiceAnalyticsData } from './combined-analytics-report';

interface ServiceAnalyticsReportProps {
  id: string;
  data: ServiceAnalyticsData;
}

export function ServiceAnalyticsReport({ id, data }: ServiceAnalyticsReportProps) {
  const { formatPrice, legalName } = useSettings();

  const {
    totalServiceRevenue,
    mostRequestedService,
    topRevenueService,
    serviceAnalytics,
    categoryAnalytics,
    filterLabel
  } = data;
  
  const chartData = React.useMemo(() => {
    // Data is already sorted descending for top-to-bottom display
    return categoryAnalytics;
  }, [categoryAnalytics]);


  const chartConfig: ChartConfig = React.useMemo(() => {
      const config: ChartConfig = {};
      categoryAnalytics.forEach(cat => {
          config[cat.name] = { label: cat.name, color: cat.fill };
      });
      return config;
  }, [categoryAnalytics]);


  return (
    <div id={id} className="p-4 bg-white text-black print-container">
      <div className="mb-6 flex justify-between items-start border-b pb-4">
        <div>
            <h1 className="text-2xl font-bold">{legalName}</h1>
            <h2 className="text-lg font-semibold text-gray-700">Service Analytics Report</h2>
            <p className="text-sm text-gray-500">For: {filterLabel}</p>
        </div>
        <Logo className="size-12" />
      </div>

       <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="border rounded-lg p-4">
              <h3 className="text-xs font-medium text-gray-500">Total Service Revenue</h3>
              <div className="text-xl font-bold">{formatPrice(totalServiceRevenue)}</div>
          </div>
          <div className="border rounded-lg p-4">
              <h3 className="text-xs font-medium text-gray-500">Most Popular</h3>
              <div className="text-lg font-bold truncate">{mostRequestedService?.name || 'N/A'}</div>
          </div>
           <div className="border rounded-lg p-4">
              <h3 className="text-xs font-medium text-gray-500">Top Earner</h3>
              <div className="text-lg font-bold truncate">{topRevenueService?.name || 'N/A'}</div>
          </div>
      </div>

      <div className="space-y-6">
        <div className="border rounded-lg p-4">
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
                                width={120}
                                className="text-xs"
                            />
                            <XAxis dataKey="revenue" type="number" hide />
                            <Bar dataKey="revenue" layout="vertical" radius={5}>
                                <LabelList 
                                    dataKey="revenue" 
                                    position="right" 
                                    offset={8} 
                                    className="fill-gray-800 text-xs"
                                    formatter={(value: number) => formatPrice(value)}
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
                <div>
                    <Table className="text-xs"><TableHeader><TableRow><TableHead>Category</TableHead><TableHead className="text-right">Revenue</TableHead></TableRow></TableHeader><TableBody>{categoryAnalytics.map(cat => (<TableRow key={cat.name}><TableCell className="font-medium">{cat.name}</TableCell><TableCell className="text-right font-mono">{formatPrice(cat.revenue)}</TableCell></TableRow>))}</TableBody></Table>
                </div>
            </div>
        </div>
        <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">Itemized Service Analytics</h3>
            <Table className="text-xs"><TableHeader><TableRow><TableHead>Service</TableHead><TableHead className="text-center">Requests</TableHead><TableHead className="text-right">Avg. Price</TableHead><TableHead className="text-right">Revenue</TableHead></TableRow></TableHeader><TableBody>{serviceAnalytics.map(service => (<TableRow key={service.name}><TableCell className="font-medium">{service.name}</TableCell><TableCell className="text-center">{service.requests}</TableCell><TableCell className="text-right font-mono">{service.requests > 0 ? formatPrice(service.revenue / service.requests) : formatPrice(0)}</TableCell><TableCell className="text-right font-mono font-bold">{formatPrice(service.revenue)}</TableCell></TableRow>))}</TableBody></Table>
        </div>
      </div>
    </div>
  );
}
