
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
import { Plus, Minus, Shirt } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { useServices } from '@/context/service-context';

type CartItem = {
    service: HotelService;
    quantity: number;
};

interface LaundryServiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LaundryServiceDialog({ isOpen, onClose }: LaundryServiceDialogProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState('');
  const { toast } = useToast();
  const { room, stay, addServiceRequests } = useStay();
  const { hotelServices } = useServices();
  const { formatPrice } = useSettings();

  const laundryServices = useMemo(() => {
    return hotelServices.filter(s => s.category === 'Laundry');
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
        description: 'Please add items to your laundry request.',
      });
      return;
    }
    if (!room || !stay) return;

    const serviceItems = cart.map(item => `${item.service.name} (x${item.quantity})`).join(', ');
    const serviceDescription = notes ? `${serviceItems}. Notes: ${notes}` : serviceItems;

    const newRequest: Omit<ServiceRequest, 'id'> = {
      stayId: stay.stayId,
      roomNumber: room.number,
      service: serviceDescription,
      status: 'Pending',
      time: 'Just now',
      creationTime: new Date(),
      staff: 'Housekeeping',
      price: cartTotal,
      category: 'Laundry',
    };

    addServiceRequests([newRequest as ServiceRequest]);

    toast({
      title: 'Laundry Request Sent',
      description: 'Housekeeping has been notified and will collect your items shortly.',
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Shirt/> Laundry Service</DialogTitle>
          <DialogDescription>
            Select the items you would like to have laundered. A staff member will collect them from your room.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
            <ScrollArea className="h-64 border rounded-md">
                <div className="p-4 space-y-4">
                {laundryServices.map(service => {
                    const quantity = getItemQuantity(service.id);
                    return (
                        <div key={service.id} className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">{service.name}</p>
                                <p className="text-sm text-muted-foreground">{formatPrice(service.price)}</p>
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
                    placeholder="Add any special instructions (e.g., 'gentle cycle only')..."
                />
            </div>

            {cart.length > 0 && (
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
