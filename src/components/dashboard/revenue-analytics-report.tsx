
'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { IndianRupee, TrendingUp, BedDouble } from 'lucide-react';
import { useSettings } from '@/context/settings-context';
import { RevenueChart, type ChartDataPoint } from './revenue-chart';
import { Logo } from '../logo';
import type { RevenueAnalyticsData } from './combined-analytics-report';


interface RevenueAnalyticsReportProps {
  id: string;
  data: RevenueAnalyticsData;
}

export function RevenueAnalyticsReport({ id, data }: RevenueAnalyticsReportProps) {
  const { formatPrice, legalName } = useSettings();

  const {
    totalRevenue,
    roomRevenue,
    serviceRevenue,
    adr,
    chartData,
    filterLabel
  } = data;

  return (
    <div id={id} className="p-4 bg-white text-black print-container">
        <div className="mb-6 flex justify-between items-start border-b pb-4">
            <div>
                <h1 className="text-2xl font-bold">{legalName}</h1>
                <h2 className="text-lg font-semibold text-gray-700">Revenue Analytics Report</h2>
                <p className="text-sm text-gray-500">For: {filterLabel}</p>
            </div>
            <Logo className="size-12" />
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="border rounded-lg p-4">
                <h3 className="text-xs font-medium text-gray-500">Total Revenue</h3>
                <div className="text-xl font-bold">{formatPrice(totalRevenue)}</div>
            </div>
             <div className="border rounded-lg p-4">
                <h3 className="text-xs font-medium text-gray-500">Room Revenue</h3>
                <div className="text-xl font-bold">{formatPrice(roomRevenue)}</div>
            </div>
             <div className="border rounded-lg p-4">
                <h3 className="text-xs font-medium text-gray-500">Service Revenue</h3>
                <div className="text-xl font-bold">{formatPrice(serviceRevenue)}</div>
            </div>
             <div className="border rounded-lg p-4">
                <h3 className="text-xs font-medium text-gray-500">Avg. Daily Rate (ADR)</h3>
                <div className="text-xl font-bold">{formatPrice(adr)}</div>
            </div>
        </div>

        <div className="border rounded-lg">
            <div className="p-6">
                <h3 className="text-lg font-semibold">Revenue Over Time</h3>
                <p className="text-sm text-gray-500">Revenue generated from checkouts for the period.</p>
            </div>
            <div className="p-6 pt-0 h-[350px] w-full">
                <RevenueChart data={chartData} />
            </div>
        </div>
    </div>
  );
}
