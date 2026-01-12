
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useStay } from '@/context/stay-context';
import type { HotelService, ServiceRequest } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '../ui/textarea';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Wrench } from 'lucide-react';
import { useServices } from '@/context/service-context';

interface MaintenanceServiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MaintenanceServiceDialog({ isOpen, onClose }: MaintenanceServiceDialogProps) {
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>();
  const [notes, setNotes] = useState('');
  const { toast } = useToast();
  const { room, stay, addServiceRequests } = useStay();
  const { hotelServices } = useServices();

  const maintenanceServices = useMemo(() => {
    return hotelServices.filter(s => s.category === 'Maintenance');
  }, [hotelServices]);

  useEffect(() => {
    if (isOpen) {
      setSelectedServiceId(undefined);
      setNotes('');
    }
  }, [isOpen]);


  const handleRequest = () => {
    const selectedService = maintenanceServices.find(s => s.id === selectedServiceId);
    if (!selectedService) {
      toast({
        variant: 'destructive',
        title: 'No service selected',
        description: 'Please select a maintenance issue to report.',
      });
      return;
    }
    if (!room || !stay) return;

    const serviceDescription = notes ? `${selectedService.name}: ${notes}` : selectedService.name;

    const newRequest: Omit<ServiceRequest, 'id'> = {
      stayId: stay.stayId,
      roomNumber: room.number,
      service: serviceDescription,
      status: 'Pending',
      time: 'Just now',
      creationTime: new Date(),
      staff: 'Housekeeping', // Or a dedicated maintenance department
      price: 0,
      category: 'Maintenance',
    };

    addServiceRequests([newRequest]);

    toast({
      title: 'Maintenance Request Sent',
      description: 'Maintenance has been notified and will attend to the issue shortly.',
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Wrench/> Maintenance Request</DialogTitle>
          <DialogDescription>
            Please select the issue you are experiencing in your room.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
            <ScrollArea className="h-48 border rounded-md p-4">
                <RadioGroup value={selectedServiceId} onValueChange={setSelectedServiceId}>
                    <div className="space-y-2">
                        {maintenanceServices.map(service => (
                            <div key={service.id} className="flex items-center space-x-2">
                                <RadioGroupItem value={service.id} id={service.id} />
                                <Label htmlFor={service.id} className="font-normal">{service.name}</Label>
                            </div>
                        ))}
                    </div>
                </RadioGroup>
            </ScrollArea>

            <div>
                <Textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Provide additional details (e.g., 'The sink in the bathroom is dripping')..."
                />
            </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleRequest} disabled={!selectedServiceId}>Send Request</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
