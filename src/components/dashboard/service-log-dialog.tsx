
'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { Room, ServiceRequest } from '@/lib/types';
import { useSettings } from '@/context/settings-context';
import { cn } from '@/lib/utils';
import { User, Hotel } from 'lucide-react';
import { format } from 'date-fns';


interface ServiceLogDialogProps {
  room: Room | null;
  serviceLog: ServiceRequest[];
  isOpen: boolean;
  onClose: () => void;
}

export function ServiceLogDialog({ room, serviceLog, isOpen, onClose }: ServiceLogDialogProps) {
  const { formatPrice } = useSettings();

  if (!isOpen || !room) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Service Log for Room {room.number}</DialogTitle>
          <DialogDescription>
            Showing all service requests and manual charges for the current stay of {room.guestName}.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh] mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service / Item</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Status / Staff</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Charge</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serviceLog.length > 0 ? (
                serviceLog.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.service}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                        <div className="flex flex-col">
                            <span>{format(new Date(req.creationTime), 'MMM d, h:mm a')}</span>
                             {req.completionTime && (
                                <span className="text-xs text-green-500">Completed: {format(new Date(req.completionTime), 'h:mm a')}</span>
                            )}
                        </div>
                    </TableCell>
                    <TableCell>
                      {req.isManualCharge ? (
                        <Badge variant="secondary">{req.staff}</Badge>
                      ) : (
                        <Badge variant="outline">{req.status}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                        <Badge variant="outline" className="flex items-center gap-1.5 w-fit">
                            {req.isManualCharge ? <Hotel className="size-3" /> : <User className="size-3" />}
                            {req.isManualCharge ? 'Hotel' : 'Guest'}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {req.price !== undefined ? formatPrice(req.price) : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No service activity recorded for this stay yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
