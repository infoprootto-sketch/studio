'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Construction } from 'lucide-react';

export default function RevenueAnalyticsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight font-headline">Revenue &amp; Service Analytics</h1>
                <p className="text-muted-foreground">
                    Comprehensive performance overview for your hotel.
                </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Analytics Under Construction</CardTitle>
                    <CardDescription>
                        This feature is being simplified for better performance and stability.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
                    <Construction className="size-12 mb-4" />
                    <h3 className="text-lg font-semibold">Coming Soon</h3>
                    <p className="text-sm">A streamlined analytics experience is on its way.</p>
                </CardContent>
            </Card>
        </div>
    )
}
