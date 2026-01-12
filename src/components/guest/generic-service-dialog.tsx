
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useStay } from '@/context/stay-context';
import type { HotelService, ServiceRequest } from '@/lib/types';
import { useSettings } from '@/context/settings-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Plus, Minus, ConciergeBell } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { useServices } from '@/context/service-context';
import { Card } from '../ui/card';
import { Label } from '../ui/label';

type CartItem = {
    service: HotelService;
    quantity: number;
};

interface GenericServiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  categoryName: string | null;
}

export function GenericServiceDialog({ isOpen, onClose, categoryName }: GenericServiceDialogProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState('');
  const { toast } = useToast();
  const { room, stay, addServiceRequests } = useStay();
  const { hotelServices } = useServices();
  const { formatPrice } = useSettings();

  const servicesBySubcategory = useMemo(() => {
    if (!categoryName) return {};
    const services = hotelServices.filter(s => s.category === categoryName);
    
    return services.reduce((acc, service) => {
        const subCat = service.subcategory || 'General';
        if (!acc[subCat]) {
            acc[subCat] = [];
        }
        acc[subCat].push(service);
        return acc;
    }, {} as Record<string, HotelService[]>);

  }, [hotelServices, categoryName]);

  const hasSubcategories = useMemo(() => {
    const keys = Object.keys(servicesBySubcategory);
    return keys.length > 1 || (keys.length === 1 && keys[0] !== 'General');
  }, [servicesBySubcategory]);


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
    if (!room || !stay || !categoryName) return;

    const requests: Omit<ServiceRequest, 'id'>[] = cart.map(item => ({
      stayId: stay.stayId,
      roomNumber: room.number,
      service: `${item.service.name}${item.quantity > 1 ? ` (x${item.quantity})` : ''}`,
      notes: notes,
      status: 'Pending',
      time: 'Just now',
      creationTime: new Date(),
      staff: 'Reception', // Default assignment, can be routed later
      price: item.service.price * item.quantity,
      category: categoryName,
      serviceId: item.service.id,
      quantity: item.quantity,
    }));

    addServiceRequests(requests);

    toast({
      title: 'Request Sent',
      description: `Your request for ${categoryName} has been sent.`,
    });
    onClose();
  };

  const renderServiceList = (services: HotelService[]) => {
      return (
          <div className="space-y-3">
              {services.map(service => {
                  const quantity = getItemQuantity(service.id);
                  return (
                      <Card key={service.id}>
                          <div className="p-3 flex items-center justify-between">
                              <div className="flex-1 pr-4">
                                  <p className="font-semibold">{service.name}</p>
                                  {service.description && (
                                    <p className="text-xs text-muted-foreground mt-1">{service.description}</p>
                                  )}
                                  <p className="text-sm font-semibold text-primary mt-2">
                                      {service.price > 0 ? formatPrice(service.price) : 'Complimentary'}
                                  </p>
                              </div>
                              <div className="flex items-center gap-2">
                                  <Button size="icon" variant="outline" className="size-8" onClick={() => updateQuantity(service, -1)} disabled={quantity === 0}>
                                      <Minus className="size-4" />
                                  </Button>
                                  <span className="font-bold w-5 text-center">{quantity > 0 && quantity}</span>
                                  <Button size="icon" variant="outline" className="size-8" onClick={() => updateQuantity(service, 1)}>
                                      <Plus className="size-4" />
                                  </Button>
                              </div>
                          </div>
                      </Card>
                  )
              })}
          </div>
      )
  }


  if (!isOpen || !categoryName) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ConciergeBell/> {categoryName}</DialogTitle>
          <DialogDescription>
            Select the services you require.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
            <ScrollArea className="h-64 border rounded-lg">
                <div className="p-1">
                {Object.keys(servicesBySubcategory).length > 0 ? (
                    hasSubcategories ? (
                        <Accordion type="multiple" defaultValue={[Object.keys(servicesBySubcategory)[0]]} className="w-full">
                            {Object.entries(servicesBySubcategory).map(([subCategory, services]) => (
                                <AccordionItem value={subCategory} key={subCategory} className="border-none">
                                    <AccordionTrigger className="px-4 py-3 text-base font-semibold hover:no-underline bg-muted/50 rounded-md">
                                        {subCategory}
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-4 px-4">
                                        {renderServiceList(services)}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    ) : (
                        <div className="p-4">{renderServiceList(servicesBySubcategory['General'] || [])}</div>
                    )
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-center p-4">
                        No services are currently available for this category.
                    </div>
                )}
                </div>
            </ScrollArea>

            <div className="space-y-2">
                <Label htmlFor="special-instructions" className="font-semibold">Special Instructions</Label>
                <Textarea 
                    id="special-instructions"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any additional notes for your request here..."
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
