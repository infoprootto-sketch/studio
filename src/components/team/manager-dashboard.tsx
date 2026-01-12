'use client';

import { useMemo } from 'react';
import { LiveActivityGrid } from "@/components/dashboard/live-activity-grid";
import { ServiceQueue } from "@/components/dashboard/service-queue";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import TeamAnalyticsPage from "@/components/dashboard/team-analytics/page";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TeamDepartment } from "@/lib/types";
import { useUser } from "@/firebase";
import { useTeam } from '@/context/team-context';

export function ManagerDashboard({ department }: { department: TeamDepartment }) {
  const { user } = useUser();
  const { teamMembers } = useTeam();

  const currentUser = useMemo(() => {
    if (!user || !teamMembers) return null;
    return teamMembers.find(member => member.id === user.uid);
  }, [user, teamMembers]);

  const userName = currentUser?.name || user?.email;
  
  return (
    <div className="space-y-6">
       <div>
        {userName && <p className="text-lg text-muted-foreground">Welcome back, {userName}</p>}
        <h1 className="text-2xl font-bold tracking-tight font-headline">
            Manager Dashboard - <span className="text-primary">{department}</span>
        </h1>
        <p className="text-muted-foreground">
          Oversee your team's performance and live hotel activity.
        </p>
      </div>

      <Tabs defaultValue="service-queue" className="mt-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="service-queue">Live Service Queue</TabsTrigger>
          <TabsTrigger value="live-stays">Manage Live Stay</TabsTrigger>
          <TabsTrigger value="analytics">Team Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="service-queue" className="mt-4">
          <Card>
              <CardHeader>
                  <CardTitle>Live Service Queue</CardTitle>
                  <CardDescription>
                    Active guest requests and tasks for your department.
                  </CardDescription>
              </CardHeader>
              <CardContent>
                  <ServiceQueue role="team" />
              </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="live-stays">
            <Card>
                <CardHeader>
                    <CardTitle>Live Guest Activity</CardTitle>
                    <CardDescription>
                        Oversee active stays and add manual charges to a guest's bill.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <LiveActivityGrid role="manager" />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="analytics" className="mt-4">
           <TeamAnalyticsPage role="team" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
