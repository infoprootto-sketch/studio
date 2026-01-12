
'use client';

import { useStay } from "@/context/stay-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Minus, Plus, ShoppingCart } from 'lucide-react';
import { useMemo } from "react";
import { useSettings } from "@/context/settings-context";
import { useToast } from "@/hooks/use-toast";
import { useServices } from "@/context/service-context";
import type { ServiceRequest } from "@/lib/types";

export function Cart() {
    const { 
        room, stay,
        cart, updateCartItemQuantity, isCartSheetOpen, setIsCartSheetOpen, 
        addServiceRequests 
    } = useStay();
    const { formatPrice } = useSettings();
    const { toast } = useToast();
    const { restaurants } = useServices();
    
    const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.service.price * item.quantity, 0), [cart]);
    const cartItemCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

    const placeOrder = () => {
        if (!room || !stay) return;
        const requestsByRestaurant: Record<string, Omit<ServiceRequest, 'id'>[]> = {};

        cart.forEach(item => {
            const restaurantId = item.service.restaurantId || 'unknown';
            if (!requestsByRestaurant[restaurantId]) {
                requestsByRestaurant[restaurantId] = [];
            }
            requestsByRestaurant[restaurantId].push({
                stayId: stay.stayId,
                roomNumber: room.number,
                service: `${item.service.name}`,
                status: 'Pending',
                time: 'Just now',
                creationTime: new Date(),
                staff: restaurants.find(r => r.id === restaurantId)?.name || 'F&B',
                price: item.service.price * item.quantity,
                category: item.service.category,
                serviceId: item.service.id,
                quantity: item.quantity,
            });
        });

        Object.entries(requestsByRestaurant).forEach(([restaurantId, requests]) => {
            addServiceRequests(requests);
            const restaurantName = restaurants.find(r => r.id === restaurantId)?.name || 'the kitchen';
            toast({
                title: 'Order Placed!',
                description: `Your order from ${restaurantName} has been sent. It will be delivered to Room ${room.number} shortly.`,
            });
        });
        
        // Clear cart after ordering
        cart.forEach(item => updateCartItemQuantity(item.service, 0));
        setIsCartSheetOpen(false);
    };

    if (cartItemCount === 0) {
        return null;
    }

    return (
        <>
            {/* Persistent Mini-Cart Bar */}
            <div className="fixed bottom-[80px] left-0 right-0 p-4 z-40 bg-transparent pointer-events-none">
                <div className="container mx-auto pointer-events-auto">
                    <Button
                        className="w-full h-14 rounded-lg shadow-lg text-lg flex items-center justify-between"
                        onClick={() => setIsCartSheetOpen(true)}
                    >
                        <div className="flex items-center gap-2">
                             <span className="bg-primary-foreground/20 text-primary-foreground text-sm font-bold rounded-full h-7 w-7 flex items-center justify-center">
                                {cartItemCount}
                             </span>
                            <span>View Your Order</span>
                        </div>
                        <span className="font-semibold">{formatPrice(cartTotal)}</span>
                    </Button>
                </div>
            </div>

            {/* Full-Screen Order Summary Dialog */}
            <Dialog open={isCartSheetOpen} onOpenChange={setIsCartSheetOpen}>
                <DialogContent className="max-w-full h-full flex flex-col p-4">
                    <DialogHeader className="text-left px-2">
                        <DialogTitle>Your Order</DialogTitle>
                        <DialogDescription>Review your items before placing the order.</DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="flex-1 my-2">
                        <div className="space-y-4 px-2">
                            {cart.map(item => (
                                <div key={item.service.id} className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <p className="font-semibold">{item.service.name}</p>
                                        <p className="text-sm text-muted-foreground">{formatPrice(item.service.price)} each</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Button size="icon" variant="outline" className="size-8" onClick={() => updateCartItemQuantity(item.service, item.quantity - 1)}>
                                                <Minus className="size-4" />
                                            </Button>
                                            <span className="font-bold w-5 text-center">{item.quantity}</span>
                                            <Button size="icon" variant="outline" className="size-8" onClick={() => updateCartItemQuantity(item.service, item.quantity + 1)}>
                                                <Plus className="size-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold">{formatPrice(item.service.price * item.quantity)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                    <DialogFooter className="flex-col gap-4 border-t pt-4">
                        <div className="w-full space-y-2 px-2">
                            <div className="flex justify-between font-semibold text-lg">
                                <span>Total</span>
                                <span>{formatPrice(cartTotal)}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Taxes and service charges will be added to your final bill.</p>
                        </div>
                        <Button className="w-full text-lg py-6" onClick={placeOrder}>
                            Place Order for Room {room?.number}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
