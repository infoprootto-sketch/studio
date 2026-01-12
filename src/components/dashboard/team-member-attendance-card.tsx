'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { TeamMember } from '@/lib/types';
import { LogIn, LogOut, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface TeamMemberAttendanceCardProps {
  member: TeamMember;
  onClockInOut: () => void;
}

export function TeamMemberAttendanceCard({ member, onClockInOut }: TeamMemberAttendanceCardProps) {
  const isClockedIn = member.attendanceStatus === 'Clocked In';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Your Attendance Status</CardTitle>
        <Badge variant={isClockedIn ? 'default' : 'secondary'} className={isClockedIn ? 'bg-green-500' : ''}>
          {member.attendanceStatus}
        </Badge>
      </CardHeader>
      <CardContent>
        {isClockedIn && member.lastClockIn && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="size-4" />
            <span>Clocked in since {format(member.lastClockIn, 'h:mm a')}</span>
          </div>
        )}
        {!isClockedIn && (
          <p className="text-muted-foreground">You are currently off the clock.</p>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={onClockInOut} variant={isClockedIn ? 'destructive' : 'default'} className="w-full sm:w-auto">
          {isClockedIn ? <LogOut className="mr-2" /> : <LogIn className="mr-2" />}
          {isClockedIn ? 'Clock Out' : 'Clock In'}
        </Button>
      </CardFooter>
    </Card>
  );
}
