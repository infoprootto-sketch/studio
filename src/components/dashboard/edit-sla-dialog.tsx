
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
import type { SlaRule } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface EditSlaDialogProps {
  slaRule: Partial<SlaRule> | null;
  serviceCategoryNames: string[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (slaRule: Partial<SlaRule>) => void;
}

export function EditSlaDialog({ slaRule, serviceCategoryNames, isOpen, onClose, onSave }: EditSlaDialogProps) {
  const [serviceName, setServiceName] = useState('');
  const [timeLimit, setTimeLimit] = useState<number | ''>('');
  const { toast } = useToast();

  const isEditing = slaRule && slaRule.id;

  useEffect(() => {
    if (isOpen) {
      if (slaRule) {
        setServiceName(slaRule.serviceName || '');
        setTimeLimit(slaRule.timeLimitMinutes ?? '');
      } else {
        setServiceName('');
        setTimeLimit('');
      }
    }
  }, [slaRule, isOpen]);

  const handleSave = () => {
    if (!serviceName || timeLimit === '' || Number(timeLimit) <= 0) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please select a service category and enter a valid time limit.',
      });
      return;
    }

    onSave({ id: slaRule?.id, serviceName, timeLimitMinutes: Number(timeLimit) });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit SLA Rule' : 'Add New SLA Rule'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? `Update the time limit for "${slaRule?.serviceName}".`
              : 'Set a new time limit for a service category.'}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="service-name">Service Category</Label>
            <Select value={serviceName} onValueChange={setServiceName}>
              <SelectTrigger id="service-name">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {serviceCategoryNames.map(name => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="time-limit">Time Limit (in minutes)</Label>
            <Input
              id="time-limit"
              type="number"
              value={timeLimit}
              onChange={e => setTimeLimit(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="e.g., 30"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>{isEditing ? 'Save Changes' : 'Add Rule'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
