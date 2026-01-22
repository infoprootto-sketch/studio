'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { CorporateClient, BilledOrder } from '@/lib/types';
import { Mail } from 'lucide-react';

interface EmailInvoiceDialogProps {
  client: CorporateClient | null;
  selectedOrders: BilledOrder[];
  isOpen: boolean;
  onClose: () => void;
}

export function EmailInvoiceDialog({ isOpen, onClose }: EmailInvoiceDialogProps) {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Email Invoices</DialogTitle>
          <DialogDescription>
            This feature is temporarily disabled while the application is being stabilized.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 text-center text-muted-foreground">
          <Mail className="mx-auto size-12" />
          <p className="mt-4">Email functionality will be restored soon.</p>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
