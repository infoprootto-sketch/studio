'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useStay } from '@/context/stay-context';
import { isWithinInterval, getDay, parse, format, isAfter } from 'date-fns';
import { X, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay";
import type { Broadcast } from '@/lib/types';


export function BroadcastBanner() {
  const { broadcasts, room } = useStay();
  const [visibleBroadcasts, setVisibleBroadcasts] = useState<Broadcast[]>([]);
  const autoplayPlugin = useRef(Autoplay({ delay: 5000, stopOnInteraction: true }));
  const [api, setApi] = React.useState<CarouselApi>()
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !broadcasts || broadcasts.length === 0 || !room) {
      setVisibleBroadcasts([]);
      return;
    }

    const now = new Date();
    const today = getDay(now);

    const activeBroadcasts = broadcasts.filter(broadcast => {
      const isTargeted =
        !broadcast.targetRoomCategories ||
        broadcast.targetRoomCategories.length === 0 ||
        broadcast.targetRoomCategories.includes(room.type);
      
      if (!isTargeted) return false;

      if (broadcast.type === 'Recurring') {
        if (!broadcast.startTime || !broadcast.endTime || !broadcast.daysOfWeek) {
          return false;
        }
        if (!broadcast.daysOfWeek.includes(today)) {
          return false;
        }
        
        const startTime = parse(broadcast.startTime, 'HH:mm', now);
        const endTime = parse(broadcast.endTime, 'HH:mm', now);
        
        // Handle overnight timings
        if (isAfter(startTime, endTime)) {
           return isWithinInterval(now, { start: startTime, end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, endTime.getHours(), endTime.getMinutes()) }) ||
                  isWithinInterval(now, { start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0), end: endTime });
        }
        
        return isWithinInterval(now, { start: startTime, end: endTime });

      } else { // One-time
        if (!broadcast.startDate || !broadcast.endDate) return false;
        return isWithinInterval(now, { start: broadcast.startDate, end: broadcast.endDate });
      }
    });

    setVisibleBroadcasts(activeBroadcasts);

  }, [isClient, broadcasts, room, api]);
  
  if (!isClient || visibleBroadcasts.length === 0) {
    return null;
  }

  return (
    <div className="relative isolate flex items-center gap-x-6 overflow-hidden bg-primary/10 px-6 py-2.5 sm:px-3.5 sm:before:flex-1">
        <Carousel
            plugins={[autoplayPlugin.current]}
            className="w-full"
            setApi={setApi}
        >
            <CarouselContent>
                {visibleBroadcasts.map(broadcast => (
                    <CarouselItem key={broadcast.id}>
                         <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                            <p className="flex items-center gap-2 text-sm leading-6 text-foreground">
                                <Megaphone className="size-4 text-primary" />
                                <strong className="font-semibold">{broadcast.title}</strong>
                                <span className="hidden sm:inline">-</span>
                                <span>{broadcast.message}</span>
                            </p>
                        </div>
                    </CarouselItem>
                ))}
            </CarouselContent>
        </Carousel>
    </div>
  );
}
