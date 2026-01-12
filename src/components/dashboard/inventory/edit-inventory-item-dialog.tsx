
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
import type { InventoryItem, HotelService } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { inventoryUnits } from '@/lib/inventory-options';
import { useServices } from '@/context/service-context';
import { useInventory } from '@/context/inventory-context';
import { Switch } from '@/components/ui/switch';
import { Check, ChevronsUpDown, PackagePlus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandInput, CommandGroup, CommandList, CommandItem } from '@/components/ui/command';
import { cn } from '@/lib/utils';


interface EditInventoryItemDialogProps {
  item: Partial<InventoryItem> | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Partial<InventoryItem>, linkedServiceId?: string) => void;
}

export function EditInventoryItemDialog({ item, isOpen, onClose, onSave }: EditInventoryItemDialogProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState<number | ''>('');
  const [parLevel, setParLevel] = useState<number | ''>('');
  const [unit, setUnit] = useState('');
  const [linkedServiceId, setLinkedServiceId] = useState<string | undefined>(undefined);
  const [isCategoryPopoverOpen, setIsCategoryPopoverOpen] = useState(false);
  
  const { toast } = useToast();
  const { hotelServices } = useServices();
  const { inventory } = useInventory();


  const isEditing = item && item.id;

  const inventoryCategories = useMemo(() => {
      const allCategories = new Set(inventory.map(i => i.category));
      return Array.from(allCategories);
  }, [inventory]);


  const servicesInCategory = useMemo(() => {
    if (!category) return [];
    return hotelServices.filter(s => s.category === category || s.category === `F&B:${category}`);
  }, [category, hotelServices]);

  useEffect(() => {
    if (isOpen) {
      if (item) {
        setName(item.name || '');
        setCategory(item.category || '');
        setStock(item.stock ?? '');
        setParLevel(item.parLevel ?? '');
        setUnit(item.unit || '');
        
        // Find if any service links to this item
        const linkedService = hotelServices.find(s => s.inventoryItemId === item.id);
        setLinkedServiceId(linkedService?.id);

      } else {
        setName('');
        setCategory('');
        setStock(0);
        setParLevel(0);
        setUnit('');
        setLinkedServiceId(undefined);
      }
    }
  }, [item, isOpen, hotelServices]);

  const handleSave = () => {
    if (!name || !category || stock === '' || parLevel === '' || !unit) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill out all fields for the inventory item.",
      });
      return;
    }

    onSave({ id: item?.id, name, category, stock: Number(stock), parLevel: Number(parLevel), unit }, linkedServiceId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Inventory Item' : 'Add New Inventory Item'}</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="item-name">Item Name</Label>
            <Input id="item-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Shampoo Bottle" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="item-category">Category</Label>
              <Popover open={isCategoryPopoverOpen} onOpenChange={setIsCategoryPopoverOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between font-normal"
                    >
                        {category ? category : "Select or create category..."}
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
                            <CommandEmpty>No category found. Type to create a new one.</CommandEmpty>
                            <CommandGroup>
                                {inventoryCategories.map((cat) => (
                                    <CommandItem
                                        key={cat}
                                        value={cat}
                                        onSelect={(currentValue) => {
                                            setCategory(currentValue === category ? "" : currentValue);
                                            setIsCategoryPopoverOpen(false);
                                        }}
                                    >
                                        <Check className={cn("mr-2 h-4 w-4", category === cat ? "opacity-100" : "opacity-0")} />
                                        {cat}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
              </Popover>
            </div>
             <div className="space-y-2">
              <Label htmlFor="item-unit">Unit</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger id="item-unit"><SelectValue placeholder="Select unit..." /></SelectTrigger>
                <SelectContent>
                  {inventoryUnits.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {category && (
            <div className="space-y-2">
                <Label htmlFor="linked-service">Link to Service/Menu Item (Optional)</Label>
                <Select value={linkedServiceId} onValueChange={setLinkedServiceId}>
                    <SelectTrigger id="linked-service">
                        <SelectValue placeholder="Select an item to link..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {servicesInCategory.map(service => (
                            <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="item-stock">Current Stock</Label>
              <Input id="item-stock" type="number" value={stock} onChange={(e) => setStock(e.target.value === '' ? '' : Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-par">Par Level</Label>
              <Input id="item-par" type="number" value={parLevel} onChange={(e) => setParLevel(e.target.value === '' ? '' : Number(e.target.value))} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>{isEditing ? 'Save Changes' : 'Add Item'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
