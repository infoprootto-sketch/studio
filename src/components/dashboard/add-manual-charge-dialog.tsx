
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Room, HotelService, Department, ServiceRequestStatus } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/context/settings-context';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Minus, ArrowLeft, X } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useServices } from '@/context/service-context';
import { findDepartmentForCategory } from '@/lib/utils';

type CartItem = {
  service: HotelService;
  quantity: number;
};

interface AddManualChargeDialogProps {
  room: Room | null;
  isOpen: boolean;
  onClose: () => void;
  onAddCharges: (items: CartItem[], status: ServiceRequestStatus, department: string) => void;
}


export function AddManualChargeDialog({ room, isOpen, onClose, onAddCharges }: AddManualChargeDialogProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [requestStatus, setRequestStatus] = useState<ServiceRequestStatus>('Completed');

  // Buffet state
  type BuffetType = 'Breakfast' | 'Lunch' | 'Dinner';
  const [buffetType, setBuffetType] = useState<BuffetType>('Breakfast');
  const [buffetPrice, setBuffetPrice] = useState<number | ''>('');
  const [buffetGuests, setBuffetGuests] = useState<number | ''>(1);

  // Custom Charge State
  const [customChargeName, setCustomChargeName] = useState('');
  const [customChargePrice, setCustomChargePrice] = useState<number | ''>('');

  const { formatPrice, currency } = useSettings();
  const { restaurants, hotelServices, serviceCategories } = useServices();
  const { toast } = useToast();

  const allServiceCategories = useMemo(() => {
    const restaurantNames = restaurants.map(r => r.name);
    // This combines restaurant names and all other user-defined service categories.
    const otherCategories = serviceCategories.filter(cat => cat.type === 'Other').map(cat => cat.name);
    return [...restaurantNames, ...otherCategories, 'Buffet', 'Other'];
  }, [restaurants, serviceCategories]);


  const total = useMemo(() => cart.reduce((sum, item) => sum + item.service.price * item.quantity, 0), [cart]);

  const servicesForCategory = useMemo(() => {
    if (!selectedCategory || !hotelServices) return [];
    
    const restaurant = restaurants.find(r => r.name === selectedCategory);
    if (restaurant) {
      return hotelServices.filter(s => s.restaurantId === restaurant.id);
    }
    
    return hotelServices.filter(s => s.category === selectedCategory);
  }, [selectedCategory, hotelServices, restaurants]);

  useEffect(() => {
    if (isOpen) {
      setCart([]);
      setSelectedCategory(null);
      setBuffetPrice('');
      setBuffetGuests(1);
      setBuffetType('Breakfast');
      setCustomChargeName('');
      setCustomChargePrice('');
      setRequestStatus('Completed');
    }
  }, [isOpen]);

  if (!isOpen || !room) return null;

  const handleSave = () => {
    if (cart.length === 0) {
      toast({
        variant: "destructive",
        title: "Cart is empty",
        description: "Please add at least one item to the cart.",
      });
      return;
    }
    // For now, we'll assign all manual charges to 'Reception' as a default.
    // The main logic in live-activity-grid will handle routing.
    onAddCharges(cart, requestStatus, 'Reception');
  };

  const addToCart = (service: HotelService) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.service.id === service.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.service.id === service.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { service, quantity: 1 }];
    });
  };

  const addBuffetToCart = () => {
    if (!buffetPrice || !buffetGuests || buffetGuests <= 0 || buffetPrice <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Buffet Details',
        description: 'Please enter a valid price and number of guests.',
      });
      return;
    }

    const buffetService: HotelService = {
      id: `buffet-${Date.now()}`,
      name: `Buffet: ${buffetType}`,
      category: 'Buffet',
      price: buffetPrice,
      description: `${buffetGuests} guest(s) at ${formatPrice(buffetPrice)} each.`
    };
    
    setCart(prevCart => [...prevCart, { service: buffetService, quantity: buffetGuests }]);
    
    // Reset buffet form and go back to category selection
    setBuffetPrice('');
    setBuffetGuests(1);
    setSelectedCategory(null);
    toast({
        title: 'Buffet Added',
        description: `${buffetService.name} (x${buffetGuests}) added to the order.`
    })
  };

  const addCustomChargeToCart = () => {
    if (!customChargeName || !customChargePrice || customChargePrice <= 0) {
        toast({
            variant: 'destructive',
            title: 'Invalid Custom Charge',
            description: 'Please enter a valid name and price for the charge.',
        });
        return;
    }
    const customService: HotelService = {
        id: `custom-${Date.now()}`,
        name: customChargeName,
        category: 'Other',
        price: customChargePrice,
        description: 'Manually added charge'
    };

    setCart(prevCart => [...prevCart, { service: customService, quantity: 1 }]);
    
    setCustomChargeName('');
    setCustomChargePrice('');
    setSelectedCategory(null);
    toast({
        title: 'Custom Charge Added',
        description: `${customService.name} added to the order.`
    });
  };

  const updateQuantity = (serviceId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(prevCart => prevCart.filter(item => item.service.id !== serviceId));
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          item.service.id === serviceId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };
  
  const removeFromCart = (serviceId: string) => {
      setCart(prevCart => prevCart.filter(item => item.service.id !== serviceId));
  }

  const renderContent = () => {
    if (selectedCategory === 'Other') {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                    <Button variant="outline" size="icon" onClick={() => setSelectedCategory(null)}>
                        <ArrowLeft className="size-4"/>
                    </Button>
                    <h3 className="text-lg font-semibold">Add Custom Charge</h3>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="custom-charge-name">Charge Name / Description</Label>
                    <Input id="custom-charge-name" value={customChargeName} onChange={(e) => setCustomChargeName(e.target.value)} placeholder="e.g., Late Checkout Fee" />
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="custom-charge-price">Price ({currency})</Label>
                    <Input id="custom-charge-price" type="number" value={customChargePrice} onChange={(e) => setCustomChargePrice(Number(e.target.value) || '')} placeholder="e.g., 50" />
                </div>
                
                <Button onClick={addCustomChargeToCart} className="w-full">Add Custom Charge to Order</Button>
            </div>
        )
    }

    if (selectedCategory === 'Buffet') {
      return (
        <div className="space-y-6">
           <div className="flex items-center gap-2 mb-4">
                <Button variant="outline" size="icon" onClick={() => setSelectedCategory(null)}>
                    <ArrowLeft className="size-4"/>
                </Button>
                <h3 className="text-lg font-semibold">Add Buffet Charge</h3>
            </div>

            <div className="space-y-2">
                <Label>Buffet Type</Label>
                <RadioGroup value={buffetType} onValueChange={(v) => setBuffetType(v as BuffetType)} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Breakfast" id="b-breakfast" />
                        <Label htmlFor="b-breakfast">Breakfast</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Lunch" id="b-lunch" />
                        <Label htmlFor="b-lunch">Lunch</Label>
                    </div>
                     <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Dinner" id="b-dinner" />
                        <Label htmlFor="b-dinner">Dinner</Label>
                    </div>
                </RadioGroup>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="buffet-price">Price / Person ({currency})</Label>
                    <Input id="buffet-price" type="number" value={buffetPrice} onChange={(e) => setBuffetPrice(Number(e.target.value) || '')} placeholder="e.g., 25" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="buffet-guests">Number of Guests</Label>
                    <Input id="buffet-guests" type="number" value={buffetGuests} onChange={(e) => setBuffetGuests(Number(e.target.value) || '')} placeholder="e.g., 2" />
                </div>
            </div>

            <Button onClick={addBuffetToCart} className="w-full">Add Buffet to Order</Button>
        </div>
      );
    }

    if (selectedCategory) {
        return (
            <>
                <div className="flex items-center gap-2 mb-4">
                    <Button variant="outline" size="icon" onClick={() => setSelectedCategory(null)}>
                        <ArrowLeft className="size-4"/>
                    </Button>
                    <h3 className="text-lg font-semibold">{selectedCategory}</h3>
                </div>
                <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-2">
                    {servicesForCategory.map(service => (
                        <div key={service.id} className="flex items-center justify-between p-2 border rounded-md">
                            <div>
                                <p className="font-medium">{service.name}</p>
                                <p className="text-sm text-muted-foreground">{formatPrice(service.price)}</p>
                            </div>
                            <Button onClick={() => addToCart(service)}>Add to Order</Button>
                        </div>
                    ))}
                    </div>
                </ScrollArea>
            </>
        )
    }

    // Category selection
    return (
        <>
            <h3 className="text-lg font-semibold mb-4">Select a Category</h3>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {allServiceCategories.map(category => (
                    <Button key={category} variant="outline" className="h-20 text-base" onClick={() => setSelectedCategory(category)}>
                    {category}
                    </Button>
                ))}
            </div>
        </>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl grid-rows-[auto,1fr,auto]" style={{height: '80vh'}}>
        <DialogHeader>
          <DialogTitle>Add Manual Charge to Room {room.number}</DialogTitle>
          <DialogDescription>
            Select items to add directly to the guest's bill. This action will be logged.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden py-4">
          {/* Main Content: Categories or Services */}
          <div className="lg:col-span-2 flex flex-col">
            {renderContent()}
          </div>
          
          {/* Cart Section */}
          <div className="lg:col-span-1 bg-muted/50 rounded-lg p-4 flex flex-col">
            <h3 className="text-lg font-semibold mb-4">Current Order</h3>
            <ScrollArea className="flex-1 -mr-4 pr-4">
              {cart.length > 0 ? (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.service.id} className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{item.service.name}</p>
                        <p className="text-sm text-muted-foreground">{item.service.id.startsWith('buffet-') ? item.service.description : formatPrice(item.service.price)}</p>
                        {!(item.service.id.startsWith('buffet-') || item.service.id.startsWith('custom-')) && (
                            <div className="flex items-center gap-2 mt-1">
                            <Button size="icon" variant="ghost" className="size-6" onClick={() => updateQuantity(item.service.id, item.quantity - 1)}>
                                <Minus className="size-4" />
                            </Button>
                            <span className="font-mono text-sm w-4 text-center">{item.quantity}</span>
                            <Button size="icon" variant="ghost" className="size-6" onClick={() => updateQuantity(item.service.id, item.quantity + 1)}>
                                <Plus className="size-4" />
                            </Button>
                            </div>
                        )}
                      </div>
                      <div className="text-right">
                          <p className="font-semibold">{formatPrice(item.service.price * item.quantity)}</p>
                           <Button size="icon" variant="ghost" className="size-6 mt-2 text-muted-foreground hover:text-destructive" onClick={() => removeFromCart(item.service.id)}>
                            <X className="size-4" />
                          </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Your order is empty.</p>
                </div>
              )}
            </ScrollArea>
            <div className="mt-4 pt-4 border-t space-y-4">
                {cart.length > 0 && (
                    <div className="flex justify-between items-center text-lg font-bold">
                        <span>Total</span>
                        <span>{formatPrice(total)}</span>
                    </div>
                )}
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex-col-reverse items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
                <Label className="font-normal text-muted-foreground">Set Status:</Label>
                <RadioGroup value={requestStatus} onValueChange={(v) => setRequestStatus(v as ServiceRequestStatus)} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Completed" id="status-completed" />
                        <Label htmlFor="status-completed" className="font-normal">Completed</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Pending" id="status-pending" />
                        <Label htmlFor="status-pending" className="font-normal">Pending</Label>
                    </div>
                </RadioGroup>
            </div>
            <div className="flex gap-2 self-end sm:self-center">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={cart.length === 0}>
                Add {cart.length} item(s) to Bill
              </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
