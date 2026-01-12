
'use client';

import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogIn, LogOut, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useTeam } from '@/context/team-context';
import { useUser, useFirestore } from '@/firebase';
import { useHotelId } from '@/context/hotel-id-context';
import { useToast } from '@/hooks/use-toast';
import { doc, arrayUnion } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { AttendanceRecord } from '@/lib/types';


export function TeamMemberAttendanceCard() {
  const { teamMembers } = useTeam();
  const { user } = useUser();
  const firestore = useFirestore();
  const hotelId = useHotelId();
  const { toast } = useToast();

  const currentUser = useMemo(() => {
    if (!user || !teamMembers) return null;
    return teamMembers.find(m => m.id === user.uid);
  }, [user, teamMembers]);

  const handleClockInOut = () => {
    if (!firestore || !hotelId || !currentUser) return;
    
    const memberRef = doc(firestore, 'hotels', hotelId, 'teamMembers', currentUser.id);

    if (currentUser.attendanceStatus === 'Clocked In') {
      // Clocking Out
      const lastRecord = currentUser.attendanceHistory?.slice(-1)[0];
      const updatedHistory = [...(currentUser.attendanceHistory || [])];
      
      if (lastRecord && !lastRecord.clockOut) {
        updatedHistory[updatedHistory.length - 1] = { ...lastRecord, clockOut: new Date() };
      }

      updateDocumentNonBlocking(memberRef, { 
        attendanceStatus: 'Clocked Out',
        attendanceHistory: updatedHistory
      });

      toast({ title: 'Clocked Out', description: 'Your shift has ended.' });

    } else {
      // Clocking In
      const newRecord: AttendanceRecord = {
        date: new Date(),
        clockIn: new Date(),
        clockOut: null,
      };

      updateDocumentNonBlocking(memberRef, {
        attendanceStatus: 'Clocked In',
        lastClockIn: new Date(),
        attendanceHistory: arrayUnion(newRecord)
      });
      
      toast({ title: 'Clocked In', description: 'Your shift has started.' });
    }
  };

  if (!currentUser) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Your Attendance Status</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Loading your attendance data...</p>
            </CardContent>
        </Card>
    )
  }

  const isClockedIn = currentUser.attendanceStatus === 'Clocked In';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Your Attendance Status</CardTitle>
        <Badge variant={isClockedIn ? 'default' : 'secondary'} className={isClockedIn ? 'bg-green-500' : ''}>
          {currentUser.attendanceStatus}
        </Badge>
      </CardHeader>
      <CardContent>
        {isClockedIn && currentUser.lastClockIn && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="size-4" />
            <span>Clocked in since {format(new Date(currentUser.lastClockIn), 'h:mm a')}</span>
          </div>
        )}
        {!isClockedIn && (
          <p className="text-muted-foreground">You are currently off the clock.</p>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleClockInOut} variant={isClockedIn ? 'destructive' : 'default'} className="w-full sm:w-auto">
          {isClockedIn ? <LogOut className="mr-2" /> : <LogIn className="mr-2" />}
          {isClockedIn ? 'Clock Out' : 'Clock In'}
        </Button>
      </CardFooter>
    </Card>
  );
}
