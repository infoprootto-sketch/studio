'use client';

import { ServiceQueue } from "@/components/dashboard/service-queue";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamMemberAttendanceCard } from "../dashboard/team-member-attendance-card";

export function MemberDashboard() {
  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">Your Dashboard</h1>
        <p className="text-muted-foreground">
          View your assigned tasks and manage your attendance.
        </p>
      </div>
      
      <TeamMemberAttendanceCard />

      <Card>
          <CardHeader>
              <CardTitle>Your Service Queue</CardTitle>
              <CardDescription>
                Active guest requests and tasks assigned to you or your department.
              </CardDescription>
          </CardHeader>
          <CardContent>
              <ServiceQueue role="team" />
          </CardContent>
      </Card>
    </div>
  );
}
