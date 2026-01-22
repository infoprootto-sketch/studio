
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { RoomCategory } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { X, Plus } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useSettings } from '@/context/settings-context';
import { useRoomActions } from '@/context/room-context';


interface EditRoomCategoryDialogProps {
  category: Partial<RoomCategory> | null;
  onSave: (category: Partial<RoomCategory>) => void;
  onClose: () => void;
}

export function EditRoomCategoryDialog({ category, onSave, onClose }: EditRoomCategoryDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState<number | ''>('');
  const [discounts, setDiscounts] = useState<(number | '')[]>([]);

  const { toast } = useToast();
  const { currency } = useSettings();

  const isEditing = category && category.id;

  useEffect(() => {
    if (category) {
      setName(category.name || '');
      setDescription(category.description || '');
      setBasePrice(category.basePrice ?? '');
      setDiscounts(category.quickDiscounts || []);
    } else {
      setName('');
      setDescription('');
      setBasePrice('');
      setDiscounts([]);
    }
  }, [category]);

  const handleSave = () => {
    if (!name || !description || basePrice === '') {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide a name, description, and base price for the category.",
      });
      return;
    }
    const validDiscounts = discounts.filter(d => d !== '' && !isNaN(Number(d))).map(Number);
    onSave({ ...category, name, description, basePrice: Number(basePrice), quickDiscounts: validDiscounts });
  };

  const handleDiscountChange = (index: number, value: string) => {
    const newDiscounts = [...discounts];
    newDiscounts[index] = value === '' ? '' : Number(value);
    setDiscounts(newDiscounts);
  };

  const addDiscount = () => {
    if (discounts.length < 5) {
      setDiscounts([...discounts, '']);
    }
  };

  const removeDiscount = (index: number) => {
    const newDiscounts = discounts.filter((_, i) => i !== index);
    setDiscounts(newDiscounts);
  };

  return (
    <div className="py-4 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
            <Label htmlFor="category-name">Category Name</Label>
            <Input id="category-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Standard Queen" disabled={!!isEditing} />
        </div>
        <div className="space-y-2">
            <Label htmlFor="category-price">Base Price / Night ({currency})</Label>
            <Input id="category-price" type="number" value={basePrice} onChange={(e) => setBasePrice(e.target.value === '' ? '' : Number(e.target.value))} placeholder="e.g., 150" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="category-description">Description</Label>
        <Textarea id="category-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., A cozy room with a comfortable queen-sized bed." />
      </div>

       <div className="space-y-2 pt-4 border-t">
          <Label>Quick-Access Discounts (%)</Label>
          <div className="space-y-2">
            {discounts.map((discount, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  type="number"
                  value={discount}
                  onChange={(e) => handleDiscountChange(index, e.target.value)}
                  placeholder="e.g., 10"
                />
                <Button size="icon" variant="ghost" onClick={() => removeDiscount(index)}>
                  <X className="size-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
          {discounts.length < 5 && (
            <Button variant="outline" size="sm" onClick={addDiscount}>
              <Plus className="mr-2" /> Add Discount
            </Button>
          )}
        </div>


      <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {isEditing ? 'Save Changes' : 'Add Category'}
          </Button>
      </div>
    </div>
  );
}
