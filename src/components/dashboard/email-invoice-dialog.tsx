
'use client';

import React, { useState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { useActionState } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import type { CorporateClient, BilledOrder } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/context/settings-context';
import { Separator } from '../ui/separator';
import { format } from 'date-fns';
import { Mail, Send } from 'lucide-react';
import { sendInvoiceEmail, type EmailState } from '@/lib/email-actions';

interface EmailInvoiceDialogProps {
  client: CorporateClient | null;
  selectedOrders: BilledOrder[];
  isOpen: boolean;
  onClose: () => void;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Sending...' : 'Send Email'}
      <Send className="ml-2" />
    </Button>
  );
}

export function EmailInvoiceDialog({ client, selectedOrders, isOpen, onClose }: EmailInvoiceDialogProps) {
  const { toast } = useToast();
  const { formatPrice, legalName, address, currency } = useSettings();

  const initialState: EmailState = { status: 'initial', message: '' };
  const [state, formAction] = useActionState(sendInvoiceEmail, initialState);

  useEffect(() => {
    if (state.status === 'success') {
      toast({
        title: 'Email Sent!',
        description: state.message,
      });
      onClose();
    } else if (state.status === 'error') {
      toast({
        variant: 'destructive',
        title: 'Email Failed to Send',
        description: state.message,
      });
    }
  }, [state, toast, onClose]);

  if (!isOpen || !client) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <form action={formAction}>
          <DialogHeader>
            <DialogTitle>Email Invoices for {client.name}</DialogTitle>
            <DialogDescription>
              You are about to send a summary for {selectedOrders.length} selected invoice(s).
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="to-email">To</Label>
              <Input
                id="to-email"
                name="to"
                type="email"
                placeholder="primary@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cc-email">CC (Optional)</Label>
              <Input
                id="cc-email"
                name="cc"
                type="email"
                placeholder="finance@example.com"
              />
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold mb-2">Selected Invoices:</h4>
              <ScrollArea className="h-32 border rounded-md p-2">
                <div className="space-y-2 text-sm">
                  {selectedOrders.map((order) => (
                    <div key={order.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{order.guestName} (Room {order.roomNumber})</p>
                        <p className="text-xs text-muted-foreground">
                          {format(order.date, 'MMM d, yyyy')}
                        </p>
                      </div>
                      <p className="font-mono">{formatPrice(order.amount)}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
          
          <input type="hidden" name="clientName" value={client.name} />
          <input type="hidden" name="orders" value={JSON.stringify(selectedOrders)} />
          <input type="hidden" name="hotelDetails" value={JSON.stringify({ legalName, address })} />
          <input type="hidden" name="currencyCode" value={currency} />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
