
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
import { useSettings } from '@/context/settings-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Plus, Minus, Sparkles } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { useServices } from '@/context/service-context';

type CartItem = {
    service: HotelService;
    quantity: number;
};

interface AmenityServiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AmenityServiceDialog({ isOpen, onClose }: AmenityServiceDialogProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState('');
  const { toast } = useToast();
  const { room, stay, addServiceRequests } = useStay();
  const { hotelServices } = useServices();
  const { formatPrice } = useSettings();

  const amenityServices = useMemo(() => {
    return hotelServices.filter(s => s.category === 'Room Amenity');
  }, [hotelServices]);

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.service.price * item.quantity, 0);
  }, [cart]);

  useEffect(() => {
    if (isOpen) {
      setCart([]);
      setNotes('');
    }
  }, [isOpen]);

  const updateQuantity = (service: HotelService, change: number) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.service.id === service.id);
      if (existingItem) {
        const newQuantity = existingItem.quantity + change;
        if (newQuantity <= 0) {
          return prevCart.filter(item => item.service.id !== service.id);
        }
        return prevCart.map(item =>
          item.service.id === service.id ? { ...item, quantity: newQuantity } : item
        );
      } else if (change > 0) {
        return [...prevCart, { service, quantity: 1 }];
      }
      return prevCart;
    });
  };

  const getItemQuantity = (serviceId: string) => {
    return cart.find(item => item.service.id === serviceId)?.quantity || 0;
  };

  const handleRequest = () => {
    if (cart.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No items selected',
        description: 'Please select items to request.',
      });
      return;
    }
    if (!room || !stay) return;

    const newRequests = cart.map(item => {
        const serviceItems = `${item.service.name} (x${item.quantity})`;
        const serviceDescription = notes ? `${serviceItems}. Notes: ${notes}` : serviceItems;
        const req: Omit<ServiceRequest, 'id'> = {
            stayId: stay.stayId,
            roomNumber: room.number,
            service: serviceDescription,
            status: 'Pending',
            time: 'Just now',
            creationTime: new Date(),
            staff: 'Housekeeping',
            price: item.service.price * item.quantity,
            category: 'Room Amenity',
        };
        return req;
    });

    addServiceRequests(newRequests);

    toast({
      title: 'Amenity Request Sent',
      description: 'Your request has been sent to housekeeping.',
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Sparkles/> Request Amenities</DialogTitle>
          <DialogDescription>
            Select any additional amenities you require for your room.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
            <ScrollArea className="h-64 border rounded-md">
                <div className="p-4 space-y-4">
                {amenityServices.map(service => {
                    const quantity = getItemQuantity(service.id);
                    return (
                        <div key={service.id} className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">{service.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {service.price > 0 ? formatPrice(service.price) : 'Complimentary'}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button size="icon" variant="outline" className="size-8" onClick={() => updateQuantity(service, -1)} disabled={quantity === 0}>
                                    <Minus className="size-4" />
                                </Button>
                                <span className="font-bold w-5 text-center">{quantity}</span>
                                <Button size="icon" variant="outline" className="size-8" onClick={() => updateQuantity(service, 1)}>
                                    <Plus className="size-4" />
                                </Button>
                            </div>
                        </div>
                    )
                })}
                </div>
            </ScrollArea>

            <div>
                <Textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any special instructions..."
                />
            </div>

            {cart.length > 0 && cartTotal > 0 && (
                 <>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                        <span>Estimated Total</span>
                        <span>{formatPrice(cartTotal)}</span>
                    </div>
                </>
            )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleRequest} disabled={cart.length === 0}>Send Request</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
