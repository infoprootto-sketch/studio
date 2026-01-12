
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
import type { Shift } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Info } from 'lucide-react';

interface EditShiftDialogProps {
  shift: Partial<Shift> | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (shift: Partial<Shift>) => void;
}

export function EditShiftDialog({ shift, isOpen, onClose, onSave }: EditShiftDialogProps) {
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const { toast } = useToast();

  const isEditing = shift && shift.id;

  useEffect(() => {
    if (isOpen) {
      if (shift) {
        setName(shift.name || '');
        setStartTime(shift.startTime || '09:00');
        setEndTime(shift.endTime || '17:00');
      } else {
        setName('');
        setStartTime('09:00');
        setEndTime('17:00');
      }
    }
  }, [shift, isOpen]);

  const handleSave = () => {
    if (!name || !startTime || !endTime) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill out all shift details.',
      });
      return;
    }

    onSave({ id: shift?.id, name, startTime, endTime });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Shift' : 'Add New Shift'}</DialogTitle>
          <DialogDescription>
            {isEditing ? `Update the details for the "${shift?.name}" shift.` : 'Create a new work shift.'}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="shift-name">Shift Name</Label>
            <Input id="shift-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Morning Shift" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time</Label>
              <Input id="start-time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">End Time</Label>
              <Input id="end-time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>
          {isEditing && (
            <div className="flex items-start gap-2 p-2 text-xs text-muted-foreground bg-muted/50 rounded-md">
                <Info className="size-4 shrink-0 mt-0.5" />
                <p>Any member assigned to this shift will have the changes in their shifts accordingly.</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>{isEditing ? 'Save Changes' : 'Add Shift'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
