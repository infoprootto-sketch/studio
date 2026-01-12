
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { CheckedOutStay } from '@/lib/types';
import { useSettings } from '@/context/settings-context';
import { format } from 'date-fns';
import { Separator } from '../ui/separator';
import { Input } from '@/components/ui/input';
import { Search, Calendar as CalendarIcon, Download, Printer } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { InvoiceDialog } from '../invoice/invoice-dialog';

function StaySummary({ stay, onPrint }: { stay: CheckedOutStay, onPrint: () => void }) {
    const { formatPrice } = useSettings();
    const bill = stay.finalBill;

    return (
        <div className="p-4 bg-muted/30">
            <div className="flex justify-between items-start">
                 <h4 className="font-semibold mb-2 text-lg">Stay Summary</h4>
                 <Button variant="outline" size="sm" onClick={onPrint}>
                    <Printer className="mr-2" /> Download Invoice
                </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <p><strong>Guest:</strong> {stay.guestName}</p>
                    <p><strong>Room:</strong> {stay.roomNumber} ({stay.roomType})</p>
                    <p><strong>Stay ID:</strong> <span className="font-mono text-xs">{stay.stayId}</span></p>
                </div>
                <div className="text-left md:text-right">
                    <p><strong>Check-in:</strong> {format(new Date(stay.checkInDate), 'MMM d, yyyy, hh:mm a')}</p>
                    <p><strong>Check-out:</strong> {format(new Date(stay.checkOutDate), 'MMM d, yyyy, hh:mm a')}</p>
                </div>
            </div>

            <Separator className="my-4" />

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
                        {bill.serviceCharges.map((item: any) => (
                            <div key={item.id} className="flex justify-between items-center text-sm">
                                <p className="text-muted-foreground">{item.service}</p>
                                <p className="font-mono">{formatPrice(item.price || 0)}</p>
                            </div>
                        ))}
                        </div>
                    </div>
                )}
            </div>

            <Separator className="my-4" />
            
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
    )
}

interface CheckoutHistoryListProps {
    checkedOutStays: CheckedOutStay[];
    filteredStays: CheckedOutStay[];
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    dateRange: DateRange | undefined;
    setDateRange: (dateRange: DateRange | undefined) => void;
}

export function CheckoutHistoryList({ 
    checkedOutStays,
    filteredStays,
    searchQuery,
    setSearchQuery,
    dateRange,
    setDateRange
}: CheckoutHistoryListProps) {
    const { formatPrice } = useSettings();
    const { toast } = useToast();
    const [invoiceStay, setInvoiceStay] = useState<CheckedOutStay | null>(null);

    const handleDownload = () => {
        if (filteredStays.length === 0) {
            toast({
                variant: 'destructive',
                title: "No Data to Export",
                description: "There are no checkout records matching the current filters."
            });
            return;
        }

        const headers = [
            "Stay ID", "Guest Name", "Room Number", "Room Type", 
            "Check-in Date", "Check-out Date", 
            "Room Charges", "Services Subtotal", "Subtotal", 
            "Service Charge", "GST", "Discount", "Amount Paid", "Final Total", 
            "Payment Method"
        ];
        
        const rows = filteredStays.map(stay => {
            const bill = stay.finalBill;
            const servicesSubtotal = bill.serviceCharges.reduce((sum, item) => sum + (item.price || 0), 0);
            
            return [
                stay.stayId,
                `"${stay.guestName.replace(/"/g, '""')}"`,
                stay.roomNumber,
                stay.roomType,
                format(new Date(stay.checkInDate), 'yyyy-MM-dd HH:mm:ss'),
                format(new Date(stay.checkOutDate), 'yyyy-MM-dd HH:mm:ss'),
                bill.roomCharges.amount,
                servicesSubtotal,
                bill.subtotal,
                bill.serviceChargeAmount,
                bill.gstAmount,
                bill.discount,
                bill.paidAmount,
                bill.total,
                `"${bill.paymentMethod.replace(/"/g, '""')}"`
            ].join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'checkout_history_report.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
            title: "Report Downloaded",
            description: "A CSV report of the filtered checkout history has been downloaded."
        })
    };


    if (checkedOutStays.length === 0) {
        return <p className="text-center text-muted-foreground py-8">No checkout history available yet.</p>
    }
  
    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search by guest or stay ID..."
                        className="pl-8 w-full"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-full sm:w-[300px] justify-start text-left font-normal",
                            !dateRange && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                        dateRange.to ? (
                            <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                            </>
                        ) : (
                            format(dateRange.from, "LLL dd, y")
                        )
                        ) : (
                        <span>Filter by checkout date...</span>
                        )}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                    />
                    </PopoverContent>
                </Popover>
                <Button variant="outline" onClick={handleDownload}>
                    <Download className="mr-2" />
                    Download Report
                </Button>
            </div>
            {filteredStays.length > 0 ? (
                <Accordion type="multiple" className="w-full border rounded-lg">
                    {filteredStays.map((stay) => (
                        <AccordionItem value={stay.stayId} key={stay.stayId}>
                            <AccordionTrigger className="px-4 hover:no-underline">
                                <div className="flex-1 grid grid-cols-6 items-center text-left gap-4">
                                    <span className="font-medium col-span-1">{stay.guestName}</span>
                                    <span className="text-sm text-muted-foreground col-span-1">Room {stay.roomNumber}</span>
                                    <span className="text-sm text-muted-foreground col-span-2 font-mono text-xs">{stay.stayId}</span>
                                    <span className="font-mono text-sm text-right col-span-1">{formatPrice(stay.finalBill.total)}</span>
                                    <span className="text-sm text-muted-foreground col-span-1 text-right">{format(new Date(stay.checkOutDate), 'MMM d, yyyy')}</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="border-t">
                                    <StaySummary stay={stay} onPrint={() => setInvoiceStay(stay)} />
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            ) : (
                <p className="text-center text-muted-foreground py-8">No matching checkout history found.</p>
            )}
             <InvoiceDialog isOpen={!!invoiceStay} onClose={() => setInvoiceStay(null)} stay={invoiceStay} />
        </div>
    );
}
