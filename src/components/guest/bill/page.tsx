
'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { FileText, Printer } from "lucide-react";
import { useStay } from "@/context/stay-context";
import { useSettings } from "@/context/settings-context";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { InvoiceDialog } from "@/components/invoice/invoice-dialog";
import type { CheckedOutStay } from "@/lib/types";

export default function BillPage() {
    const { stay, room, serviceLog, billSummary } = useStay();
    const { formatPrice } = useSettings();
    const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
    
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

    if (!stay || !billSummary) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileText /> Your Stay Folio</CardTitle>
                    <CardDescription>Loading your bill...</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Please wait while we fetch the details of your stay.</p>
                </CardContent>
            </Card>
        )
    }

    const { roomTotal, servicesTotal, subtotal, serviceChargeAmount, gstAmount, totalWithTaxes, paidAmount, currentBalance, nights } = billSummary;

    const liveStayForInvoice: CheckedOutStay | null = stay && room ? {
        stayId: stay.stayId,
        roomNumber: room.number,
        roomType: room.type,
        guestName: stay.guestName,
        checkInDate: stay.checkInDate,
        checkOutDate: stay.checkOutDate,
        finalBill: {
            roomCharges: { label: `${room.type} (${nights} nights)`, amount: roomTotal },
            serviceCharges: serviceLog,
            subtotal,
            serviceChargeAmount,
            gstAmount,
            paidAmount,
            discount: 0, 
            total: totalWithTaxes,
            paymentMethod: stay.isBilledToCompany ? 'Billed to Company' : 'Pending',
        },
    } : null;

    return (
      <>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline text-2xl"><FileText /> Your Stay Folio</CardTitle>
                <CardDescription>A real-time, itemized list of all charges for your stay.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="font-semibold mb-2">Room Charges</h3>
                    <div className="flex justify-between items-center text-sm">
                        <p>{room?.type} ({nights} {nights === 1 ? 'night' : 'nights'})</p>
                        <p className="font-mono">{formatPrice(roomTotal)}</p>
                    </div>
                </div>

                {serviceLog.length > 0 && (
                    <div>
                        <h3 className="font-semibold mb-2">Services & Charges</h3>
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
                        <p className="font-mono">{formatPrice(subtotal)}</p>
                    </div>
                    <div className="flex justify-between items-center">
                        <p className="text-muted-foreground">Service Charge ({billSummary.serviceChargeRate}%)</p>
                        <p className="font-mono">{formatPrice(serviceChargeAmount)}</p>
                    </div>
                    <div className="flex justify-between items-center">
                        <p className="text-muted-foreground">GST ({billSummary.gstRate}%)</p>
                        <p className="font-mono">{formatPrice(gstAmount)}</p>
                    </div>
                    
                    <Separator className="my-2"/>
                    
                    <div className="flex justify-between items-center text-muted-foreground pt-2">
                        <p>Total Billed</p>
                        <p className="font-mono">{formatPrice(totalWithTaxes)}</p>
                    </div>
                    <div className="flex justify-between items-center text-muted-foreground">
                        <p>Paid Amount</p>
                        <p className="font-mono text-green-500">-{formatPrice(paidAmount)}</p>
                    </div>
                    
                    <Separator className="my-2"/>
                    
                    <div className="flex justify-between items-center font-bold text-base pt-2">
                        <p>Current Balance</p>
                        <p className="font-mono">{formatPrice(currentBalance)}</p>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={() => setIsInvoiceOpen(true)} className="w-full" disabled={!liveStayForInvoice}>
                    <Printer className="mr-2" /> Generate Printable Invoice
                </Button>
            </CardFooter>
        </Card>
        <InvoiceDialog isOpen={isInvoiceOpen} onClose={() => setIsInvoiceOpen(false)} stay={liveStayForInvoice} />
      </>
    )
}

    