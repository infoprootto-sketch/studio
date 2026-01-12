

'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { CheckedOutStay } from '@/lib/types';
import { useSettings } from '@/context/settings-context';
import { format } from 'date-fns';
import { Printer } from 'lucide-react';
import Link from 'next/link';
import { InvoiceDialog } from '../invoice/invoice-dialog';


interface StayHistoryDialogProps {
  stay: CheckedOutStay | null;
  isOpen: boolean;
  onClose: () => void;
}

export function StayHistoryDialog({ stay, isOpen, onClose }: StayHistoryDialogProps) {
  const { formatPrice } = useSettings();
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  if (!isOpen || !stay) return null;

  const bill = stay.finalBill;

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Past Stay Details</DialogTitle>
          <DialogDescription>Summary for the stay in Room {stay.roomNumber}.</DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                    <p><strong>Guest:</strong> {stay.guestName}</p>
                    <p><strong>Room:</strong> {stay.roomNumber} ({stay.roomType})</p>
                    <p><strong>Check-in:</strong> {format(new Date(stay.checkInDate), 'MMM d, yyyy, hh:mm a')}</p>
                    <p><strong>Check-out:</strong> {format(new Date(stay.checkOutDate), 'MMM d, yyyy, hh:mm a')}</p>
                </div>
                <p><strong>Stay ID:</strong> <span className="font-mono text-xs">{stay.stayId}</span></p>

                <Separator />

                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <p className="font-medium">Room Charges</p>
                        <p className="font-mono">{formatPrice(bill.roomCharges.amount)}</p>
                    </div>
                    <p className="text-sm text-muted-foreground pl-4">{bill.roomCharges.label}</p>

                    {bill.serviceCharges.length > 0 && (
                        <div className="pt-2">
                            <p className="font-medium mb-1">Service Charges</p>
                            <div className="pl-4 space-y-1">
                                {bill.serviceCharges.map(item => (
                                    <div key={item.id} className="flex justify-between items-center text-sm">
                                        <p className="text-muted-foreground">{item.service}</p>
                                        <p className="font-mono">{formatPrice(item.price || 0)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <Separator />
                
                <div className="space-y-1 text-sm">
                    <div className="flex justify-between items-center">
                        <p className="text-muted-foreground">Subtotal</p>
                        <p className="font-mono">{formatPrice(bill.subtotal)}</p>
                    </div>
                    <div className="flex justify-between items-center">
                        <p className="text-muted-foreground">Paid Amount</p>
                        <p className="font-mono text-green-500">-{formatPrice(bill.paidAmount)}</p>
                    </div>
                    {bill.discount > 0 && (
                        <div className="flex justify-between items-center">
                            <p className="text-muted-foreground">Discount</p>
                            <p className="font-mono text-green-500">-{formatPrice(bill.discount)}</p>
                        </div>
                    )}
                    <div className="flex justify-between items-center font-bold text-base pt-2">
                        <p>Total</p>
                        <p className="font-mono">{formatPrice(bill.total)}</p>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <p>Payment Method</p>
                        <p>{bill.paymentMethod}</p>
                    </div>
                </div>
            </div>
        </div>

        <DialogFooter className="sm:justify-between">
            <Button variant="outline" onClick={() => setIsInvoiceOpen(true)}>
              <Printer className="mr-2" />
              Download Invoice
            </Button>
            <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <InvoiceDialog isOpen={isInvoiceOpen} onClose={() => setIsInvoiceOpen(false)} stay={stay} />
    </>
  );
}
