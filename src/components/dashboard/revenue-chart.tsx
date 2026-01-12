'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, LineChart, Line } from 'recharts';
import { useSettings } from '@/context/settings-context';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { useTheme } from 'next-themes';

export type ChartDataPoint = {
  date: string;
  revenue: number;
};

interface RevenueChartProps {
  data: ChartDataPoint[];
}

const chartConfig = {
  revenue: {
    label: 'Revenue',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

export function RevenueChart({ data }: RevenueChartProps) {
  const { formatPrice } = useSettings();
  const { theme } = useTheme();

  return (
    <ChartContainer config={chartConfig} className="w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
            <LineChart
                data={data}
                margin={{
                    top: 5,
                    right: 20,
                    left: 20,
                    bottom: 5,
                }}
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    tick={{ fill: theme === 'dark' ? 'white' : 'black', fontSize: 12 }}
                    />
                <YAxis 
                    tickFormatter={(value) => formatPrice(value as number).replace(/(\.00|,\d{2})$/,'')}
                    tick={{ fill: theme === 'dark' ? 'white' : 'black', fontSize: 12 }}
                />
                <Tooltip
                    content={<ChartTooltipContent
                        formatter={(value) => formatPrice(value as number)}
                        nameKey="name"
                        cursor={true}
                    />}
                />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: 'hsl(var(--primary))' }} />
            </LineChart>
        </ResponsiveContainer>
    </ChartContainer>
  );
}
