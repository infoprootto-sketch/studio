
'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
import type { Vendor } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInventory } from '@/context/inventory-context';


interface EditVendorDialogProps {
  vendor: Partial<Vendor> | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (vendor: Partial<Vendor>) => void;
}

export function EditVendorDialog({ vendor, isOpen, onClose, onSave }: EditVendorDialogProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const { toast } = useToast();
  const { inventory } = useInventory();

  const isEditing = vendor && vendor.id;

  const inventoryCategories = useMemo(() => {
    const allCategories = new Set(inventory.map(i => i.category));
    return Array.from(allCategories);
  }, [inventory]);

  useEffect(() => {
    if (isOpen) {
      if (vendor) {
        setName(vendor.name || '');
        setCategory(vendor.category || '');
        setContactPerson(vendor.contactPerson || '');
        setEmail(vendor.email || '');
        setPhone(vendor.phone || '');
        setAddress(vendor.address || '');
      } else {
        setName('');
        setCategory('');
        setContactPerson('');
        setEmail('');
        setPhone('');
        setAddress('');
      }
    }
  }, [vendor, isOpen]);

  const handleSave = () => {
    if (!name || !contactPerson || !email || !phone) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill out all required fields.',
      });
      return;
    }

    if (isEditing) {
      onSave({ id: vendor?.id, name, category, contactPerson, email, phone, address });
    } else {
      const newVendorData = { name, category, contactPerson, email, phone, address };
      onSave(newVendorData);
    }
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Vendor' : 'Add New Vendor'}</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label htmlFor="vendor-name">Vendor Name</Label>
                <Input id="vendor-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., CleanCo Supplies" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="item-category"><SelectValue placeholder="Select category..." /></SelectTrigger>
                <SelectContent>
                  {inventoryCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact-person">Contact Person</Label>
              <Input id="contact-person" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="e.g., John Clean" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g., 123-456-7890" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g., john@cleanco.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g., 123 Supply Rd, Clean City" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>{isEditing ? 'Save Changes' : 'Add Vendor'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
