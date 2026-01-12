
'use client';

import { LiveActivityGrid } from "@/components/dashboard/live-activity-grid";
import { ServiceQueue } from "@/components/dashboard/service-queue";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LiveActivityPageContent() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') === 'live-stays' ? 'live-stays' : 'service-queue';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">Live Operations</h1>
        <p className="text-muted-foreground">Oversee all real-time hotel activity, from guest stays to service requests.</p>
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="service-queue">Live Service Queue</TabsTrigger>
          <TabsTrigger value="live-stays">Manage Live Stay</TabsTrigger>
        </TabsList>
        <TabsContent value="service-queue">
          <Card>
            <CardHeader>
              <CardTitle>Live Service Queue</CardTitle>
              <CardDescription>Active guest requests and tasks.</CardDescription>
            </CardHeader>
            <CardContent>
              <ServiceQueue />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="live-stays">
          <Card>
            <CardHeader>
              <CardTitle>Live Guest Activity</CardTitle>
              <CardDescription>
                Manage active stays, add manual charges, and view service logs for all occupied rooms.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LiveActivityGrid />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function LiveActivityPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LiveActivityPageContent />
    </Suspense>
  )
}
