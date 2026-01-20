
'use client';

import { LineChart, Line, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { useTheme } from 'next-themes';

export type OccupancyChartDataPoint = {
  date: string;
  occupancy: number;
};

interface OccupancyChartProps {
  data: OccupancyChartDataPoint[];
}

const chartConfig = {
  occupancy: {
    label: 'Occupancy',
    color: 'hsl(var(--chart-2))', // Using a different color from revenue
  },
} satisfies ChartConfig;

export function OccupancyChart({ data }: OccupancyChartProps) {
  const { theme } = useTheme();

  return (
    <ChartContainer config={chartConfig} className="w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
            <LineChart
                data={data}
                margin={{
                    top: 5,
                    right: 20,
                    left: 0,
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
                    tickFormatter={(value) => `${value}%`}
                    domain={[0, 100]}
                    tick={{ fill: theme === 'dark' ? 'white' : 'black', fontSize: 12 }}
                />
                <Tooltip
                    content={<ChartTooltipContent
                        formatter={(value) => `${Number(value).toFixed(1)}%`}
                        nameKey="name"
                        cursor={true}
                    />}
                />
                <Line type="monotone" dataKey="occupancy" name="Occupancy" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 4, fill: 'hsl(var(--chart-2))' }} />
            </LineChart>
        </ResponsiveContainer>
    </ChartContainer>
  );
}
