
'use client';

import { useMemo } from 'react';
import { useServices } from '@/context/service-context';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useHotelId } from '@/context/hotel-id-context';
import { Badge } from '@/components/ui/badge';

export function PendingServiceQueue() {
  const { serviceRequests } = useServices();
  const hotelId = useHotelId();

  const pendingRequests = useMemo(() => {
    return serviceRequests
      .filter(req => req.status === 'Pending')
      .sort((a, b) => new Date(a.creationTime).getTime() - new Date(b.creationTime).getTime());
  }, [serviceRequests]);

  if (pendingRequests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center">
        <p className="text-muted-foreground">No pending service requests.</p>
        <Button variant="outline" size="sm" className="mt-4" asChild>
            <Link href={`/${hotelId}/dashboard/live-activity`}>
                View Full Queue
            </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
        <ScrollArea className="h-40">
            <div className="space-y-2 pr-4">
            {pendingRequests.map(req => (
                <div key={req.id} className="flex items-center justify-between p-2 rounded-md border border-dashed">
                <div>
                    <p className="text-sm font-medium">Room {req.roomNumber}: <span className="text-muted-foreground">{req.service}</span></p>
                    <p className="text-xs text-muted-foreground">
                    Requested {formatDistanceToNow(new Date(req.creationTime), { addSuffix: true })}
                    </p>
                </div>
                <Badge variant="secondary">{req.staff}</Badge>
                </div>
            ))}
            </div>
        </ScrollArea>
        <Button variant="outline" className="w-full" asChild>
            <Link href={`/${hotelId}/dashboard/live-activity`}>
                Go to Live Activity Queue <ArrowRight className="ml-2 size-4" />
            </Link>
        </Button>
    </div>
  );
}
