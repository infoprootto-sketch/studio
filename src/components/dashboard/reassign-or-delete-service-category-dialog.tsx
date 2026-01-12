
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
import type { ServiceCategory } from '@/lib/types';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

interface ReassignOrDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  categoryToDelete: ServiceCategory | null;
  itemCount: number;
  allCategories: ServiceCategory[];
  onConfirm: (action: 'reassign' | 'delete', oldCategory: ServiceCategory, newCategoryName?: string) => void;
}

const CREATE_NEW_VALUE = '__CREATE_NEW__';

export function ReassignOrDeleteServiceCategoryDialog({
  isOpen,
  onClose,
  categoryToDelete,
  itemCount,
  allCategories,
  onConfirm,
}: ReassignOrDeleteDialogProps) {
  const [action, setAction] = useState<'reassign' | 'delete'>('reassign');
  const [targetCategory, setTargetCategory] = useState<string>('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const { toast } = useToast();

  const availableCategories = allCategories.filter(c => c.id !== categoryToDelete?.id) || [];

  useEffect(() => {
    if (isOpen) {
      setAction('reassign');
      setTargetCategory(availableCategories.length > 0 ? availableCategories[0].name : CREATE_NEW_VALUE);
      setNewCategoryName('');
    }
  }, [isOpen, allCategories]);

  const handleConfirm = () => {
    if (!categoryToDelete) return;
    
    if (action === 'reassign') {
        let finalTargetCategory = targetCategory;
        if (targetCategory === CREATE_NEW_VALUE) {
            if (!newCategoryName.trim()) {
                toast({ variant: 'destructive', title: 'New Category Name Required' });
                return;
            }
            if (allCategories.some(c => c.name.toLowerCase() === newCategoryName.trim().toLowerCase())) {
                toast({ variant: 'destructive', title: 'Category Already Exists' });
                return;
            }
            finalTargetCategory = newCategoryName.trim();
        }

        if (!finalTargetCategory) {
            toast({ variant: 'destructive', title: 'No Target Category', description: 'Please select or create a category to move items to.' });
            return;
        }
        onConfirm('reassign', categoryToDelete, finalTargetCategory);
    } else { // 'delete' action
        onConfirm('delete', categoryToDelete);
    }
  };

  if (!isOpen || !categoryToDelete) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="text-yellow-500" /> Delete Category "{categoryToDelete.name}"
          </DialogTitle>
          <DialogDescription>
            This category contains {itemCount} service(s). Please choose what to do with them.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <RadioGroup value={action} onValueChange={(v) => setAction(v as any)}>
                <div className="space-y-2 p-4 border rounded-md has-[:checked]:bg-muted">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="reassign" id="reassign-option" />
                        <Label htmlFor="reassign-option" className="font-semibold">Re-assign services to another category</Label>
                    </div>
                     {action === 'reassign' && (
                        <div className="pl-6 space-y-2 pt-2">
                            <Select value={targetCategory} onValueChange={setTargetCategory}>
                                <SelectTrigger><SelectValue placeholder="Select a category..." /></SelectTrigger>
                                <SelectContent>
                                    {availableCategories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                                    ))}
                                    <SelectItem value={CREATE_NEW_VALUE}>
                                        <div className="flex items-center gap-2"><Plus className="size-4" /> Create New...</div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            {targetCategory === CREATE_NEW_VALUE && (
                                <Input
                                    value={newCategoryName}
                                    onChange={e => setNewCategoryName(e.target.value)}
                                    placeholder="New category name..."
                                />
                            )}
                        </div>
                    )}
                </div>

                <div className="space-y-2 p-4 border rounded-md has-[:checked]:bg-destructive/10 has-[:checked]:border-destructive">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="delete" id="delete-option" />
                        <Label htmlFor="delete-option" className="font-semibold text-destructive">Delete the category and all {itemCount} services within it</Label>
                    </div>
                    {action === 'delete' && (
                        <p className="pl-6 text-sm text-destructive">This action is permanent and cannot be undone.</p>
                    )}
                </div>
            </RadioGroup>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            variant={action === 'delete' ? 'destructive' : 'default'}
          >
            {action === 'delete' ? <><Trash2 className="mr-2"/> Confirm Deletion</> : 'Re-assign & Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
