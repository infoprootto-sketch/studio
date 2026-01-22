

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
import type { Hotel } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface EditHotelDialogProps {
  hotel: Hotel | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (hotelId: string, updates: Partial<Hotel>) => void;
}

const plans: Hotel['plan'][] = ['Boutique', 'Business', 'Enterprise'];

export function EditHotelDialog({ hotel, isOpen, onClose, onSave }: EditHotelDialogProps) {
  const [plan, setPlan] = useState<Hotel['plan']>('Boutique');
  const [roomLimit, setRoomLimit] = useState<number | ''>('');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && hotel) {
      setPlan(hotel.plan || 'Boutique');
      setRoomLimit(hotel.roomLimit || 50);
    }
  }, [hotel, isOpen]);

  const handleSave = () => {
    if (!hotel) return;
    if (roomLimit === '' || Number(roomLimit) <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Room Limit",
        description: "Please enter a valid number for the room limit.",
      });
      return;
    }

    onSave(hotel.id, { plan, roomLimit: Number(roomLimit) });
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Hotel: {hotel?.name}</DialogTitle>
          <DialogDescription>
            Update the subscription plan and room limit for this hotel.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="plan">Subscription Plan</Label>
            <Select value={plan} onValueChange={(value) => setPlan(value as Hotel['plan'])}>
              <SelectTrigger id="plan">
                <SelectValue placeholder="Select a plan" />
              </SelectTrigger>
              <SelectContent>
                {plans.map(p => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="room-limit">Room Limit</Label>
            <Input
              id="room-limit"
              type="number"
              value={roomLimit}
              onChange={e => setRoomLimit(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="e.g., 50"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
