'use client';

import React from 'react';

export function OccupancyChart({ data }: { data: any[] }) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">Charting library removed for stability.</div>
}

export type OccupancyChartDataPoint = {
  date: string;
  occupancy: number;
};
