
'use client';

import React, { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { RoomCategory, InventoryItem } from '@/lib/types';
import { PlusCircle, Trash2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { useRooms } from '@/context/room-context';


interface CleaningChecklistProps {
  inventoryItems: InventoryItem[];
}

export function CleaningChecklist({ inventoryItems }: CleaningChecklistProps) {
  const { toast } = useToast();
  const { roomCategories, updateCategory } = useRooms();

  const handleConsumableChange = (categoryId: string, index: number, field: 'itemId' | 'quantity', value: string) => {
    const category = roomCategories.find(c => c.id === categoryId);
    if (!category) return;
    const newConsumables = [...(category.cleaningConsumables || [])];
    newConsumables[index] = {
      ...newConsumables[index],
      [field]: field === 'quantity' ? Number(value) : value,
    };
    updateCategory(categoryId, { cleaningConsumables: newConsumables });
  };

  const addConsumable = (categoryId: string) => {
    const category = roomCategories.find(c => c.id === categoryId);
    if (!category) return;
    const newConsumables = [...(category.cleaningConsumables || []), { itemId: '', quantity: 1 }];
    updateCategory(categoryId, { cleaningConsumables: newConsumables });
  };

  const removeConsumable = (categoryId: string, index: number) => {
    const category = roomCategories.find(c => c.id === categoryId);
    if (!category) return;
    const newConsumables = (category.cleaningConsumables || []).filter((_, i) => i !== index);
    updateCategory(categoryId, { cleaningConsumables: newConsumables });
  };
  
  const handleSaveChanges = () => {
    toast({
        title: "Checklists Saved",
        description: "Your cleaning checklists have been updated for all room categories."
    })
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Accordion type="multiple" className="w-full space-y-4">
          {roomCategories.map(category => (
            <AccordionItem value={category.id} key={category.id} className="border rounded-lg">
              <AccordionTrigger className="p-4 text-lg font-semibold hover:no-underline">{category.name}</AccordionTrigger>
              <AccordionContent className="p-4 pt-0">
                <div className="space-y-4">
                  {(category.cleaningConsumables || []).map((consumable, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="flex-1">
                        <Select
                          value={consumable.itemId}
                          onValueChange={(value) => handleConsumableChange(category.id, index, 'itemId', value)}
                        >
                          <SelectTrigger><SelectValue placeholder="Select item..." /></SelectTrigger>
                          <SelectContent>
                            {inventoryItems.map(item => (
                              <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-24">
                        <Input
                          type="number"
                          value={consumable.quantity}
                          onChange={(e) => handleConsumableChange(category.id, index, 'quantity', e.target.value)}
                          placeholder="Qty"
                        />
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeConsumable(category.id, index)}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => addConsumable(category.id)}>
                    <PlusCircle className="mr-2" /> Add Item
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
