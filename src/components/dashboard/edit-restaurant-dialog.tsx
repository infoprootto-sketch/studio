
'use client';

import React, { useState, useEffect } from 'react';
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
import type { Restaurant } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface EditRestaurantDialogProps {
  restaurant: Partial<Restaurant> | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (restaurant: Partial<Restaurant>) => void;
}

export function EditRestaurantDialog({ restaurant, isOpen, onClose, onSave }: EditRestaurantDialogProps) {
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [cuisineTags, setCuisineTags] = useState('');
  const { toast } = useToast();

  const isEditing = restaurant && restaurant.id;

  useEffect(() => {
    if (isOpen) {
      if (restaurant) {
        setName(restaurant.name || '');
        setImageUrl(restaurant.imageUrl || '');
        setCuisineTags((restaurant.cuisineTags || []).join(', '));
      } else {
        setName('');
        setImageUrl('');
        setCuisineTags('');
      }
    }
  }, [restaurant, isOpen]);

  const handleSave = () => {
    if (!name) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide a name for the restaurant.",
      });
      return;
    }

    const saveData: Partial<Restaurant> = { 
        name,
        imageUrl,
        cuisineTags: cuisineTags.split(',').map(tag => tag.trim()).filter(Boolean),
    };
    if (isEditing) {
      saveData.id = restaurant.id;
    }

    onSave(saveData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Restaurant' : 'Add New Restaurant'}</DialogTitle>
          <DialogDescription>
            {isEditing ? `Update the details for "${restaurant?.name}".` : 'Enter the details for the new restaurant or kitchen.'}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="restaurant-name">Restaurant Name</Label>
            <Input id="restaurant-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., The Rooftop Grill" />
          </div>
           <div className="space-y-2">
            <Label htmlFor="restaurant-image">Image URL</Label>
            <Input id="restaurant-image" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" />
          </div>
           <div className="space-y-2">
            <Label htmlFor="restaurant-tags">Cuisine Tags</Label>
            <Input id="restaurant-tags" value={cuisineTags} onChange={(e) => setCuisineTags(e.target.value)} placeholder="e.g., Indian, North Indian, Tandoor" />
            <p className="text-xs text-muted-foreground">Separate tags with a comma.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {isEditing ? 'Save Changes' : 'Add Restaurant'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
