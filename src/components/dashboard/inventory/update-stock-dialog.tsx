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
import { Textarea } from '@/components/ui/textarea';
import type { InventoryItem } from '@/lib/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';

type MovementType = 'Restock' | 'Consumption' | 'Adjustment';

interface UpdateStockDialogProps {
  item: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (item: InventoryItem, quantityChange: number, type: MovementType, notes?: string) => void;
}

export function UpdateStockDialog({ item, isOpen, onClose, onConfirm }: UpdateStockDialogProps) {
  const [movementType, setMovementType] = useState<MovementType>('Restock');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setMovementType('Restock');
      setQuantity('');
      setNotes('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (!item || quantity === '' || quantity <= 0) {
      toast({ variant: 'destructive', title: 'Invalid Quantity', description: 'Please enter a valid, positive quantity.' });
      return;
    }
    const quantityChange = movementType === 'Restock' ? Number(quantity) : -Number(quantity);
    onConfirm(item, quantityChange, movementType, notes);
    onClose();
  };

  if (!isOpen || !item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Stock for {item.name}</DialogTitle>
          <DialogDescription>
            Current stock: {item.stock} {item.unit}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label>Movement Type</Label>
            <RadioGroup value={movementType} onValueChange={(v) => setMovementType(v as MovementType)} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Restock" id="type-restock" />
                <Label htmlFor="type-restock">Restock</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Consumption" id="type-consumption" />
                <Label htmlFor="type-consumption">Consumption</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Adjustment" id="type-adjustment" />
                <Label htmlFor="type-adjustment">Adjustment</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity ({item.unit})</Label>
            <Input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))} placeholder="e.g., 50" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g., New shipment from Supplier X" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm}>Update Stock</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
