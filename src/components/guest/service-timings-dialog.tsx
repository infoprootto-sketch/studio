
'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useServices } from '@/context/service-context';

interface GuestServiceTimingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GuestServiceTimingsDialog({ isOpen, onClose }: GuestServiceTimingsDialogProps) {
  const { serviceTimings } = useServices();
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock /> Service Timings
          </DialogTitle>
          <DialogDescription>
            Operational hours for our key services.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-96 py-4">
          <div className="space-y-4 pr-4">
            {serviceTimings.map(service => (
              <div key={service.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-center">
                  <p className="font-semibold">{service.name}</p>
                  <Badge variant={service.enabled ? 'default' : 'destructive'} className={cn(service.enabled ? "bg-green-500" : "")}>
                    {service.enabled ? 'Open' : 'Closed'}
                  </Badge>
                </div>
                {service.enabled && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {service.startTime} – {service.endTime}
                  </p>
                )}
              </div>
            ))}
             {serviceTimings.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                    <p>Service timings have not been configured.</p>
                </div>
             )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
