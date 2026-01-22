

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { Room, ServiceRequest, CorporateClient, Stay, BilledOrderStatus } from '@/lib/types';
import { useSettings } from '@/context/settings-context';
import { differenceInCalendarDays } from 'date-fns';
import { useRoomState, useRoomActions } from '@/context/room-context';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Info, IndianRupee, AlertTriangle } from 'lucide-react';
import { useBilling } from '@/context/billing-context';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';


interface GenerateBillSheetProps {
  room: Room | null;
  serviceLog: ServiceRequest[];
  isOpen: boolean;
  onClose: () => void;
  onMarkAsPaid: (roomId: string, stayId: string, amount: number) => void;
  onBillToCompany: (room: Room, stay: Stay, companyId: string, amount: number, status: BilledOrderStatus) => void;
}

type DiscountType = 'percent' | 'amount';

export function GenerateBillSheet({ room, serviceLog, isOpen, onClose, onMarkAsPaid, onBillToCompany }: GenerateBillSheetProps) {
  const { gstRate, serviceChargeRate, formatPrice, currency } = useSettings();
  const { corporateClients } = useBilling();
  const { rooms } = useRoomState();
  const { archiveStay, forceCheckout } = useRoomActions();
  
  const stay = room?.stayId ? rooms.find(r => r.id === room.id)?.stays.find(s => s.stayId === room?.stayId) : undefined;

  const [discountType, setDiscountType] = useState<DiscountType>('percent');
  const [discountValue, setDiscountValue] = useState<number | ''>(0);
  const [selectedCompany, setSelectedCompany] = useState<string | undefined>();
  const [companyBillStatus, setCompanyBillStatus] = useState<BilledOrderStatus>('Pending');
  const { toast } = useToast();
  
  const groupedServiceLog = useMemo(() => {
    if (!serviceLog) return [];

    const serviceMap = new Map<string, { service: string; quantity: number; price: number; total: number }>();

    serviceLog.forEach(item => {
        const serviceName = item.service.replace(/ \(x\d+\)$/, '').trim();
        const unitPrice = item.price && (item.quantity || 1) > 0 ? item.price / item.quantity! : (item.price || 0);

        if (serviceMap.has(serviceName)) {
            const existing = serviceMap.get(serviceName)!;
            existing.quantity += item.quantity || 1;
            existing.total += item.price || 0;
        } else {
            serviceMap.set(serviceName, {
                service: serviceName,
                quantity: item.quantity || 1,
                price: unitPrice,
                total: item.price || 0
            });
        }
    });

    return Array.from(serviceMap.values());
  }, [serviceLog]);

  const billSummary = useMemo(() => {
    if (!stay || !room) return null;

    const nights = differenceInCalendarDays(new Date(stay.checkOutDate), new Date(stay.checkInDate)) || 1;
    const roomTotal = stay.roomCharge * nights;
    const servicesTotal = serviceLog.reduce((sum, item) => sum + (item.price || 0), 0);
    const subtotal = roomTotal + servicesTotal;
    
    const discountAmount = discountType === 'percent'
      ? subtotal * ((Number(discountValue) || 0) / 100)
      : (Number(discountValue) || 0);
      
    const discountedSubtotal = subtotal - discountAmount;
    
    const serviceChargeAmount = (discountedSubtotal * serviceChargeRate) / 100;
    const gstAmount = (discountedSubtotal * gstRate) / 100;
    const totalWithTaxes = discountedSubtotal + serviceChargeAmount + gstAmount;

    const paidAmount = stay.paidAmount || 0;
    const currentBalance = totalWithTaxes - paidAmount;

    return { nights, roomTotal, servicesTotal, subtotal, discountAmount, serviceChargeAmount, gstAmount, totalWithTaxes, paidAmount, currentBalance };
  }, [stay, room, serviceLog, gstRate, serviceChargeRate, discountType, discountValue]);

  useEffect(() => {
    if(isOpen) {
        setDiscountValue(0);
        setSelectedCompany(undefined);
        setCompanyBillStatus('Pending');
    }
  }, [isOpen]);

  const handleFinalCheckout = () => {
    if (!room || !stay || !billSummary) return;

    if (billSummary.currentBalance > 0 && !stay.isBilledToCompany) {
      toast({
        variant: "destructive",
        title: "Outstanding Balance",
        description: "Please clear the balance or bill to a company before final checkout.",
      });
      return;
    }
    
    archiveStay(room, stay, {
        roomCharges: { label: `${room.type} (${billSummary.nights} nights)`, amount: billSummary.roomTotal },
        serviceCharges: serviceLog,
        subtotal: billSummary.subtotal,
        serviceChargeAmount: billSummary.serviceChargeAmount,
        gstAmount: billSummary.gstAmount,
        paidAmount: billSummary.paidAmount,
        discount: billSummary.discountAmount,
        total: billSummary.totalWithTaxes,
        paymentMethod: stay.isBilledToCompany ? `Billed to ${corporateClients.find(c => c.id === selectedCompany)?.name || 'Company'}` : 'Card/Cash',
    });
    
    onClose();
  }
  
  const handleForceCheckout = () => {
    if (!room || !stay || !billSummary) return;

    forceCheckout(room, stay, {
        roomCharges: { label: `${room.type} (${billSummary.nights} nights)`, amount: billSummary.roomTotal },
        serviceCharges: serviceLog,
        subtotal: billSummary.subtotal,
        serviceChargeAmount: billSummary.serviceChargeAmount,
        gstAmount: billSummary.gstAmount,
        paidAmount: billSummary.paidAmount,
        discount: billSummary.discountAmount,
        total: billSummary.totalWithTaxes,
        paymentMethod: stay.isBilledToCompany ? `Billed to ${corporateClients.find(c => c.id === selectedCompany)?.name || 'Company'}` : 'Card/Cash',
    });
    
    onClose();
  }


  if (!isOpen || !room || !stay || !billSummary) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-2xl w-full flex flex-col">
        <SheetHeader>
          <SheetTitle>Billing for Room {room.number}</SheetTitle>
          <SheetDescription>
            Review charges for {stay.guestName}, apply payments, and finalize the stay.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-6 py-4">
                <div className="space-y-2">
                    <h4 className="font-semibold text-base">Room Charges</h4>
                    <div className="flex justify-between items-center text-sm">
                        <p>{room.type} ({billSummary.nights} nights)</p>
                        <p className="font-mono">{formatPrice(billSummary.roomTotal)}</p>
                    </div>
                </div>
                 {serviceLog.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="font-semibold text-base">Services & Charges</h4>
                        <div className="space-y-1">
                        {groupedServiceLog.map(item => (
                            <div key={item.service} className="flex justify-between items-center text-sm">
                                <p className="text-muted-foreground">
                                    {item.service}
                                    {item.quantity > 1 && <span className="ml-2">x{item.quantity}</span>}
                                </p>
                                <p className="font-mono">{formatPrice(item.total)}</p>
                            </div>
                        ))}
                        </div>
                    </div>
                )}
                
                <Separator />

                <div className="space-y-1 text-sm">
                    <div className="flex justify-between items-center">
                        <p className="text-muted-foreground">Subtotal</p>
                        <p className="font-mono">{formatPrice(billSummary.subtotal)}</p>
                    </div>
                     {billSummary.discountAmount > 0 && (
                      <div className="flex justify-between items-center text-green-500">
                          <p>Discount</p>
                          <p className="font-mono">-{formatPrice(billSummary.discountAmount)}</p>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                        <p className="text-muted-foreground">Service Charge ({serviceChargeRate}%)</p>
                        <p className="font-mono">{formatPrice(billSummary.serviceChargeAmount)}</p>
                    </div>
                    <div className="flex justify-between items-center">
                        <p className="text-muted-foreground">GST ({gstRate}%)</p>
                        <p className="font-mono">{formatPrice(billSummary.gstAmount)}</p>
                    </div>
                    
                    <Separator className="my-2"/>
                    
                    <div className="flex justify-between items-center font-semibold text-base pt-2">
                        <p>Total Billed</p>
                        <p className="font-mono">{formatPrice(billSummary.totalWithTaxes)}</p>
                    </div>
                    <div className="flex justify-between items-center">
                        <p className="text-muted-foreground">Paid Amount</p>
                        <p className="font-mono text-green-500">-{formatPrice(billSummary.paidAmount)}</p>
                    </div>
                    
                    <Separator className="my-2"/>
                    
                    <div className="flex justify-between items-center font-bold text-xl pt-2">
                        <p>Current Balance</p>
                        <p className="font-mono">{formatPrice(billSummary.currentBalance)}</p>
                    </div>
                </div>

                <Separator />
                
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Apply Discount</Label>
                        <div className="flex gap-2">
                            <Select value={discountType} onValueChange={(v) => setDiscountType(v as DiscountType)}>
                                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="percent">Percent</SelectItem>
                                    <SelectItem value="amount">Amount</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="relative flex-1">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                {discountType === 'percent' ? '%' : currency}
                              </span>
                              <Input type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0" className="pl-8 h-9" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Assign to Company</Label>
                        <div className="flex flex-col sm:flex-row gap-2">
                             <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                                <SelectTrigger><SelectValue placeholder="Select a company..."/></SelectTrigger>
                                <SelectContent>
                                    {corporateClients.map(client => (
                                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={companyBillStatus} onValueChange={(v) => setCompanyBillStatus(v as BilledOrderStatus)} disabled={!selectedCompany}>
                                <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Pending">Bill as Pending</SelectItem>
                                    <SelectItem value="Paid">Bill as Paid</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button 
                            className="w-full"
                            disabled={!selectedCompany || billSummary.currentBalance <= 0}
                            onClick={() => onBillToCompany(room, stay, selectedCompany!, billSummary.currentBalance, companyBillStatus)}
                        >Bill to Company</Button>
                    </div>

                    <div className="space-y-2">
                        <Label>Mark as Paid</Label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                 <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                 <Input readOnly value={formatPrice(billSummary.currentBalance)} className="pl-8" />
                            </div>
                             <Button className="w-full flex-1" onClick={() => onMarkAsPaid(room.id, stay.stayId, billSummary.currentBalance)} disabled={billSummary.currentBalance <= 0}>
                                Mark as Paid
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </ScrollArea>
        <SheetFooter className="flex-col sm:flex-row sm:justify-between items-center pt-4">
            {billSummary.currentBalance > 0 && !stay.isBilledToCompany && (
                <div className="text-sm text-destructive font-semibold flex items-center gap-2">
                    <Info className="size-4" />
                    <p>Balance due before checkout.</p>
                </div>
            )}
            <div className="flex gap-2 w-full justify-end">
                <Button variant="outline" onClick={onClose}>Close</Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="flex items-center gap-2">
                            <AlertTriangle className="size-4" />
                            Force Checkout
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This forcefully ends the stay, archives the current bill, and sets the room status to 'Cleaning'. Use this only if the standard checkout fails. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleForceCheckout}>Confirm Force Checkout</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <Button onClick={handleFinalCheckout} disabled={billSummary.currentBalance > 0 && !stay.isBilledToCompany}>Final Checkout</Button>
            </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
