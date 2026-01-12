
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { HotelService, Restaurant, ServiceCategory } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown, PackagePlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { usePathname } from 'next/navigation';
import { Switch } from '../ui/switch';
import { useServices } from '@/context/service-context';
import { useSettings } from '@/context/settings-context';
import { useInventory } from '@/context/inventory-context';

interface EditServiceDialogProps {
  service: Partial<HotelService> | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (service: Partial<HotelService>) => void;
  dialogType: 'food' | 'other';
  restaurantId?: string;
}

export function EditServiceDialog({ service, isOpen, onClose, onSave, dialogType, restaurantId }: EditServiceDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('');
  const [subcategory, setSubcategory] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [discount, setDiscount] = useState<number | ''>('');
  const [inventoryItemId, setInventoryItemId] = useState<string | undefined>(undefined);
  const [inventoryQuantity, setInventoryQuantity] = useState<number | ''>(1);
  const [addToInventory, setAddToInventory] = useState(false);

  const [isCategoryPopoverOpen, setIsCategoryPopoverOpen] = useState(false);
  const { currency } = useSettings();
  const { inventory, addInventoryItem } = useInventory();
  const { restaurants, serviceCategories, hotelServices } = useServices();
  
  const { toast } = useToast();

  const isEditing = service && service.id;
  
  const currentRestaurant = useMemo(() => {
    if (dialogType !== 'food' || !restaurantId) return null;
    return restaurants.find(r => r.id === restaurantId);
  }, [restaurants, restaurantId, dialogType]);

  const currentCategories = useMemo(() => {
    if (dialogType === 'food') {
      return currentRestaurant?.categories || [];
    }
    return serviceCategories.filter(c => c.type === 'Other').map(c => c.name);
  }, [dialogType, currentRestaurant, serviceCategories]);


  useEffect(() => {
    if (isOpen) {
        if (isEditing && service) {
            setName(service.name || '');
            setDescription(service.description || '');
            setCategory(service.category?.replace('F&B:', '') || (dialogType === 'food' ? '' : ''));
            setSubcategory(service.subcategory || '');
            setPrice(service.price ?? '');
            setDiscount(service.discount ?? '');
            setInventoryItemId(service.inventoryItemId || undefined);
            setInventoryQuantity(service.inventoryQuantityConsumed || 1);
            setAddToInventory(false);
        } else {
            setName('');
            setDescription('');
            setCategory(service?.category || '');
            setSubcategory('');
            setPrice('');
            setDiscount('');
            setInventoryItemId(undefined);
            setInventoryQuantity(1);
            setAddToInventory(false);
        }
    }
  }, [service, isOpen, dialogType, isEditing]);

  const handleSave = () => {
    if (!name || !category || price === '') {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill out all fields.",
      });
      return;
    }
    
    const finalCategory = dialogType === 'food' ? `F&B:${category}` : category;

    const serviceData: Partial<HotelService> = { 
        name, 
        description, 
        category: finalCategory, 
        subcategory,
        price: Number(price),
    };

    if (discount !== '') {
        serviceData.discount = Number(discount);
    }
    
    if (dialogType === 'food') {
        serviceData.restaurantId = restaurantId;
    }

    if (isEditing) {
        serviceData.id = service.id;
    }
    
    if (inventoryItemId && inventoryItemId !== 'none') {
        serviceData.inventoryItemId = inventoryItemId;
        serviceData.inventoryQuantityConsumed = Number(inventoryQuantity);
    }

    onSave(serviceData);

    if (addToInventory && !isEditing) {
        const newInventoryItem: Omit<InventoryItem, 'id'> = {
            name: name,
            category: category,
            stock: 0,
            parLevel: 0,
            unit: 'pieces' // default unit
        };
        addInventoryItem(newInventoryItem);
        toast({
            title: "Inventory Item Added",
            description: `"${name}" has been added to inventory with a stock of 0.`,
        });
    }
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Service' : `Add New ${dialogType === 'food' ? 'Menu Item' : 'Service'}`}</DialogTitle>
          <DialogDescription>
            {isEditing ? `Update the details for "${service?.name}".` : 'Enter the details for the new item.'}
            {dialogType === 'food' && currentRestaurant && <span className="block mt-1 font-semibold text-primary">Restaurant: {currentRestaurant.name}</span>}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
            <div className="space-y-2">
                <Label htmlFor="service-name">Name</Label>
                <Input id="service-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={dialogType === 'food' ? "e.g., Club Sandwich" : "e.g., Express Laundry"} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-description">Description (Optional)</Label>
              <Textarea id="service-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A short description of the item or service." />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Category</Label>
                    <Popover open={isCategoryPopoverOpen} onOpenChange={setIsCategoryPopoverOpen}>
                        <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={isCategoryPopoverOpen}
                            className="w-full justify-between font-normal"
                            disabled={dialogType === 'food' && !currentRestaurant}
                        >
                            {category ? category : "Select category..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                            <CommandInput 
                                placeholder="Search or create category..."
                                value={category}
                                onValueChange={setCategory}
                            />
                            <CommandList>
                                <CommandEmpty>
                                    <div className="p-2 text-sm">
                                        No category found. You can still type a new one and save.
                                    </div>
                                </CommandEmpty>
                                <CommandGroup>
                                {currentCategories.map((cat) => (
                                    <CommandItem
                                    key={cat}
                                    value={cat}
                                    onSelect={(currentValue) => {
                                        setCategory(currentValue === category ? "" : currentValue);
                                        setIsCategoryPopoverOpen(false);
                                    }}
                                    >
                                    <Check
                                        className={cn(
                                        "mr-2 h-4 w-4",
                                        category === cat ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {cat}
                                    </CommandItem>
                                ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                        </PopoverContent>
                    </Popover>
                </div>
                 {dialogType === 'other' && (
                    <div className="space-y-2">
                        <Label htmlFor="service-subcategory">Sub-category (Optional)</Label>
                        <Input id="service-subcategory" value={subcategory} onChange={(e) => setSubcategory(e.target.value)} placeholder="e.g., Massage" />
                    </div>
                 )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                  <Label htmlFor="service-price">Price ({currency})</Label>
                  <Input id="service-price" type="number" value={price} onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))} placeholder="e.g., 18.00" />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="service-discount">Discount (%)</Label>
                  <Input id="service-discount" type="number" value={discount} onChange={(e) => setDiscount(e.target.value === '' ? '' : Number(e.target.value))} placeholder="e.g., 10" />
              </div>
            </div>
            <div className="space-y-2 pt-4 border-t">
                <Label>Inventory Options</Label>
                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-2">
                        <Label htmlFor="inventory-item" className="text-xs text-muted-foreground">Consumed Item</Label>
                         <Select value={inventoryItemId} onValueChange={setInventoryItemId} disabled={addToInventory}>
                            <SelectTrigger id="inventory-item">
                                <SelectValue placeholder="Select an inventory item..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {inventory.map((item) => (
                                    <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="inventory-quantity" className="text-xs text-muted-foreground">Quantity</Label>
                        <Input id="inventory-quantity" type="number" value={inventoryQuantity} onChange={(e) => setInventoryQuantity(Number(e.target.value) || 1)} disabled={!inventoryItemId || inventoryItemId === 'none' || addToInventory} />
                    </div>
                </div>
                 {!isEditing && (
                    <div className="flex items-center space-x-2 pt-4">
                        <Switch id="add-to-inventory" checked={addToInventory} onCheckedChange={setAddToInventory} />
                        <Label htmlFor="add-to-inventory" className="flex items-center gap-2">
                            <PackagePlus className="size-4" /> Add this service as a new inventory item
                        </Label>
                    </div>
                )}
            </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>
            {isEditing ? 'Save Changes' : 'Add Item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
