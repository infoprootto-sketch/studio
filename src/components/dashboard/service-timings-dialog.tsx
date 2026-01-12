
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';
import type { ServiceTiming } from '@/lib/types';
import { useServices } from '@/context/service-context';


interface ServiceTimingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ServiceTimingsDialog({ isOpen, onClose }: ServiceTimingsDialogProps) {
  const { 
    serviceTimings, 
    restaurants, 
    serviceCategories,
    addServiceTiming,
    updateRestaurant,
    updateHotelService,
    setServiceTimings
  } = useServices();

  const [editableTimings, setEditableTimings] = useState<ServiceTiming[]>([]);
  const { toast } = useToast();

  const allServiceNames = useMemo(() => {
    const restaurantNames = restaurants.map(r => r.name);
    const otherCategoryNames = serviceCategories.filter(sc => sc.type === 'Other').map(sc => sc.name);
    return ['In-Room Dining', ...restaurantNames, ...otherCategoryNames];
  }, [restaurants, serviceCategories]);

  useEffect(() => {
    if (isOpen) {
        const existingTimingNames = new Set(serviceTimings.map(t => t.name));
        const newTimings: Omit<ServiceTiming, 'id'>[] = [];

        allServiceNames.forEach(name => {
            if (!existingTimingNames.has(name)) {
                newTimings.push({
                    name: name,
                    enabled: true,
                    startTime: '09:00',
                    endTime: '17:00',
                });
            }
        });

        if (newTimings.length > 0) {
            newTimings.forEach(timing => addServiceTiming(timing));
        }
        
        // Use the latest from context after potential additions
        setEditableTimings(serviceTimings);
    }
  }, [isOpen, serviceTimings, allServiceNames, addServiceTiming]);

  const handleToggle = (id: string, enabled: boolean) => {
    setEditableTimings(timings => timings.map(t => (t.id === id ? { ...t, enabled } : t)));
  };

  const handleTimeChange = (id: string, field: 'startTime' | 'endTime', value: string) => {
    setEditableTimings(timings => timings.map(t => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const handleSave = () => {
    setServiceTimings(editableTimings);
    toast({
      title: 'Service Timings Saved',
      description: 'Your operational hours have been updated.',
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Service Timings Management</DialogTitle>
          <DialogDescription>
            Set the operational hours for your hotel's key services. This will affect when guests can place orders or make requests.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] p-1">
            <div className="space-y-4 pr-4">
              {editableTimings.map(service => (
                <div key={service.id} className="p-4 border rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <Label htmlFor={`switch-${service.id}`} className="text-base font-medium">{service.name}</Label>
                    <p className="text-sm text-muted-foreground">
                      {service.enabled ? `Available from ${service.startTime} to ${service.endTime}` : 'Currently disabled'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`switch-${service.id}`}
                        checked={service.enabled}
                        onCheckedChange={(checked) => handleToggle(service.id, checked)}
                      />
                      <Label htmlFor={`switch-${service.id}`}>{service.enabled ? 'On' : 'Off'}</Label>
                    </div>
                    {service.enabled && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={service.startTime}
                          onChange={(e) => handleTimeChange(service.id, 'startTime', e.target.value)}
                          className="w-auto"
                        />
                        <span>-</span>
                        <Input
                          type="time"
                          value={service.endTime}
                          onChange={(e) => handleTimeChange(service.id, 'endTime', e.target.value)}
                          className="w-auto"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
        </ScrollArea>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>
            <Save className="mr-2" />
            Save All Timings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
