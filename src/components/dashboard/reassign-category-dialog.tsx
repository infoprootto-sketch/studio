
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Restaurant } from '@/lib/types';
import { AlertCircle, Plus } from 'lucide-react';

interface ReassignCategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: Restaurant | null;
  categoryToDelete: string | null;
  itemCount: number;
  onConfirm: (restaurantId: string, oldCategory: string, newCategory: string) => void;
}

const CREATE_NEW_VALUE = '__CREATE_NEW__';

export function ReassignCategoryDialog({
  isOpen,
  onClose,
  restaurant,
  categoryToDelete,
  itemCount,
  onConfirm,
}: ReassignCategoryDialogProps) {
  const [targetCategory, setTargetCategory] = useState<string>('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const { toast } = useToast();

  const availableCategories = restaurant?.categories?.filter(c => c !== categoryToDelete) || [];

  useEffect(() => {
    if (isOpen) {
      // Set the default selection to the first available category, or empty string if none exist.
      setTargetCategory(availableCategories.length > 0 ? availableCategories[0] : '');
      setNewCategoryName('');
    }
  }, [isOpen, restaurant]); // Dependency on `restaurant` ensures `availableCategories` is fresh

  const handleConfirm = () => {
    if (!restaurant || !categoryToDelete) return;

    let finalTargetCategory = targetCategory;
    
    if (targetCategory === CREATE_NEW_VALUE) {
        if (!newCategoryName.trim()) {
            toast({
                variant: 'destructive',
                title: 'New Category Name Required',
                description: 'Please enter a name for the new category.',
            });
            return;
        }
        if (restaurant.categories?.includes(newCategoryName.trim())) {
            toast({
                variant: 'destructive',
                title: 'Category Already Exists',
                description: `A category named "${newCategoryName.trim()}" already exists.`,
            });
            return;
        }
        finalTargetCategory = newCategoryName.trim();
    }
    
    if (!finalTargetCategory) {
      toast({
        variant: 'destructive',
        title: 'No Target Category',
        description: 'Please select or create a category to move items to.',
      });
      return;
    }

    onConfirm(restaurant.id, categoryToDelete, finalTargetCategory);
  };

  if (!isOpen || !restaurant || !categoryToDelete) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="text-yellow-500" /> Re-assign Category
          </DialogTitle>
          <DialogDescription>
            The category "{categoryToDelete}" contains {itemCount} menu item(s). To delete it,
            please re-assign these items to another category.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="target-category">Move Items to Category</Label>
            <Select value={targetCategory} onValueChange={setTargetCategory}>
              <SelectTrigger id="target-category">
                <SelectValue placeholder="Select a category..." />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
                <SelectItem value={CREATE_NEW_VALUE}>
                  <div className="flex items-center gap-2">
                    <Plus className="size-4" /> Create New Category...
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          {targetCategory === CREATE_NEW_VALUE && (
            <div className="space-y-2 pl-2 border-l-2 border-primary ml-1">
              <Label htmlFor="new-category-name">New Category Name</Label>
              <Input
                id="new-category-name"
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                placeholder="e.g., Soups & Salads"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Re-assign and Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
