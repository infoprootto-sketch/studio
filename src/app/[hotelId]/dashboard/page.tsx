
'use client';

import Link from 'next/link';
import { OverviewCards } from '@/components/dashboard/overview-cards';
import { RoomGrid } from '@/components/dashboard/room-grid';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UpcomingMovements } from '@/components/dashboard/upcoming-movements';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useRooms } from '@/context/room-context';
import { useHotelId } from '@/context/hotel-id-context';
import { PendingServiceQueue } from '@/components/dashboard/pending-service-queue';
import { OccupancyCheck } from '@/components/dashboard/occupancy-check';


export default function DashboardPage() {
  const { rooms } = useRooms();
  const hotelId = useHotelId();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-headline">Dashboard</h1>
          <p className="text-muted-foreground">A real-time overview of your hotel's performance.</p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href={`/${hotelId}/dashboard/reservations/create-booking`}>
            <PlusCircle className="mr-2" />
            Create New Booking
          </Link>
        </Button>
      </div>
      
      <OverviewCards rooms={rooms} />

      <OccupancyCheck />
      
      <div className="grid grid-cols-1 gap-8">
          <Card>
              <CardHeader>
              <CardTitle>Upcoming Movements</CardTitle>
              <CardDescription>Arrivals and departures for today.</CardDescription>
              </CardHeader>
              <CardContent>
                <UpcomingMovements />
              </CardContent>
          </Card>

          <Card>
              <CardHeader>
              <CardTitle>Pending Service Requests</CardTitle>
              <CardDescription>Guest requests that need attention.</CardDescription>
              </CardHeader>
              <CardContent>
                <PendingServiceQueue />
              </CardContent>
          </Card>
      </div>

      <Card>
          <CardHeader>
          <CardTitle>Room Status</CardTitle>
          <CardDescription>Real-time overview of all rooms.</CardDescription>
          </CardHeader>
          <CardContent>
            <RoomGrid initialRooms={rooms} />
          </CardContent>
      </Card>
    </div>
  );
}
