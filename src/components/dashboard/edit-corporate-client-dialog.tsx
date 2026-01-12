
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
import type { CorporateClient } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface EditCorporateClientDialogProps {
  client: Partial<CorporateClient> | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Partial<CorporateClient>) => void;
}

export function EditCorporateClientDialog({ client, isOpen, onClose, onSave }: EditCorporateClientDialogProps) {
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [address, setAddress] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const { toast } = useToast();

  const isEditing = client && client.id;

  useEffect(() => {
    if (isOpen) {
      if (client) {
        setName(client.name || '');
        setContactPerson(client.contactPerson || '');
        setAddress(client.address || '');
        setGstNumber(client.gstNumber || '');
      } else {
        setName('');
        setContactPerson('');
        setAddress('');
        setGstNumber('');
      }
    }
  }, [client, isOpen]);

  const handleSave = () => {
    if (!name || !contactPerson || !address || !gstNumber) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill out all fields for the client, including GST number.",
      });
      return;
    }

    const saveData: Partial<CorporateClient> = {
        name,
        contactPerson,
        address,
        gstNumber,
        billedOrders: client?.billedOrders || [],
    };

    if (isEditing) {
        saveData.id = client.id;
    }

    onSave(saveData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Corporate Client' : 'Add New Corporate Client'}</DialogTitle>
          <DialogDescription>
            {isEditing ? `Update the details for "${client?.name}".` : 'Enter the details for the new client.'}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client-name">Company Name</Label>
            <Input id="client-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Innovate Corp" />
          </div>
           <div className="space-y-2">
            <Label htmlFor="client-contact">Contact Person</Label>
            <Input id="client-contact" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="e.g., Alice Johnson" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-gst">GST Number</Label>
            <Input id="client-gst" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} placeholder="e.g., 27ABCDE1234F1Z5" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-address">Address</Label>
            <Textarea id="client-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g., 123 Tech Park, Silicon Valley, CA" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {isEditing ? 'Save Changes' : 'Add Client'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
