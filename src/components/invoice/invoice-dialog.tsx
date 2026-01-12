
'use client';

import { useSettings } from "@/context/settings-context";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Printer } from "lucide-react";
import { useMemo } from "react";
import { Logo } from "../logo";
import type { CheckedOutStay } from "@/lib/types";

interface InvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  stay: CheckedOutStay | null;
}

export function InvoiceDialog({ isOpen, onClose, stay: historicalStay }: InvoiceDialogProps) {
    const settings = useSettings();

    const invoiceData = useMemo(() => {
        if (!historicalStay) return null;

        const { finalBill } = historicalStay;

        const groupedServiceCharges = (finalBill.serviceCharges || []).reduce((acc: any, item: any) => {
            const serviceName = item.service.replace(/ \(x\d+\)$/, '').trim();
            if (!acc[serviceName]) {
                acc[serviceName] = { ...item, quantity: 0, total: 0 };
            }
            acc[serviceName].quantity += item.quantity || 1;
            acc[serviceName].total += item.price || 0;
            acc[serviceName].price = item.price && item.quantity ? item.price / item.quantity : item.price;
            return acc;
        }, {});

        const checkInDate = (historicalStay.checkInDate as any)?.toDate ? (historicalStay.checkInDate as any).toDate() : new Date(historicalStay.checkInDate);
        const checkOutDate = (historicalStay.checkOutDate as any)?.toDate ? (historicalStay.checkOutDate as any).toDate() : new Date(historicalStay.checkOutDate);


        return {
            stayId: historicalStay.stayId,
            guestName: historicalStay.guestName,
            roomNumber: historicalStay.roomNumber,
            roomType: historicalStay.roomType,
            checkInDate,
            checkOutDate,
            billDetails: {
                ...finalBill,
                serviceCharges: Object.values(groupedServiceCharges),
                balance: finalBill.total - finalBill.paidAmount,
            }
        };
    }, [historicalStay, settings]);

    const handlePrint = () => {
        const printContent = document.getElementById('printable-invoice-content');
        if (printContent) {
            const printWindow = window.open('', '_blank', 'height=800,width=800');
            if (printWindow) {
                const styles = Array.from(document.head.getElementsByTagName('link'))
                    .filter(link => link.rel === 'stylesheet')
                    .map(link => link.outerHTML)
                    .join('');

                printWindow.document.write('<html><head><title>Print Invoice</title>');
                printWindow.document.write(styles);
                printWindow.document.write('<style>body { -webkit-print-color-adjust: exact; } @media print { body { padding: 2rem; } }</style>');
                printWindow.document.write('</head><body>');
                printWindow.document.write(printContent.innerHTML);
                printWindow.document.write('</body></html>');
                printWindow.document.close();
                setTimeout(() => {
                    printWindow.print();
                }, 500);
            }
        }
    }

    if (!isOpen) {
        return null;
    }
    
    if (!invoiceData) {
        return (
             <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Error</DialogTitle>
                    </DialogHeader>
                    <p>Could not load invoice data for this stay.</p>
                     <DialogFooter>
                        <Button variant="outline" onClick={onClose}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )
    }
    
    const { formatPrice, legalName, address, gstNumber } = settings;
    const { stayId, guestName, roomNumber, roomType, checkInDate, checkOutDate, billDetails } = invoiceData;
    const { roomCharges, serviceCharges, subtotal, serviceChargeAmount, gstAmount, paidAmount, total, balance } = billDetails;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-4xl p-0">
                     <DialogHeader className="p-6 pb-0">
                        <DialogTitle>Print Invoice</DialogTitle>
                    </DialogHeader>
                    <div className="p-6">
                        <p>Your invoice is ready to print. Click the button below to open the invoice in a new tab for printing.</p>
                    </div>
                    <DialogFooter className="p-6 pt-0">
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                        <Button onClick={handlePrint}><Printer className="mr-2" /> Print</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="hidden">
                <div id="printable-invoice-content" className="p-8">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h1 className="text-3xl font-bold font-headline">{legalName}</h1>
                            <p className="text-sm text-gray-500">{address}</p>
                            <p className="text-sm text-gray-500">GSTIN: {gstNumber}</p>
                        </div>
                        <div className="text-right">
                             <Logo className="size-16" />
                        </div>
                    </div>
                     <div className="mb-8">
                        <h2 className="text-2xl font-bold">Invoice</h2>
                        <p className="text-sm text-gray-500">Stay ID: {stayId}</p>
                        <p className="text-sm text-gray-500">Date: {format(new Date(), 'MMM d, yyyy')}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-6 mb-8 text-sm">
                        <div>
                            <h3 className="font-semibold mb-2">Billed To</h3>
                            <p>{guestName}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Room Details</h3>
                            <p>Room {roomNumber} ({roomType})</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Stay Dates</h3>
                            <p>Check-in: {format(new Date(checkInDate), 'MMM d, yyyy')}</p>
                            <p>Check-out: {format(new Date(checkOutDate), 'MMM d, yyyy')}</p>
                        </div>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-3/5">Description</TableHead>
                                <TableHead>Qty</TableHead>
                                <TableHead>Unit Price</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell>{roomCharges.label}</TableCell>
                                <TableCell>1</TableCell>
                                <TableCell>{formatPrice(roomCharges.amount)}</TableCell>
                                <TableCell className="text-right">{formatPrice(roomCharges.amount)}</TableCell>
                            </TableRow>
                            {serviceCharges.map((item: any, index: number) => (
                                <TableRow key={item.id || index}>
                                    <TableCell className="text-gray-600">{item.service}</TableCell>
                                    <TableCell>{item.quantity}</TableCell>
                                    <TableCell>{formatPrice(item.price)}</TableCell>
                                    <TableCell className="text-right">{formatPrice(item.total)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <div className="flex justify-end mt-4">
                        <div className="w-full max-w-sm space-y-2 text-sm">
                            <Separator />
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>{formatPrice(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-gray-500">
                                <span>Service Charge ({settings.serviceChargeRate}%)</span>
                                <span>{formatPrice(serviceChargeAmount)}</span>
                            </div>
                            <div className="flex justify-between text-gray-500">
                                <span>GST ({settings.gstRate}%)</span>
                                <span>{formatPrice(gstAmount)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold text-base">
                                <span>Total</span>
                                <span>{formatPrice(total)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Amount Paid</span>
                                <span className="text-green-600">-{formatPrice(paidAmount)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold text-lg">
                                <span>Balance Due</span>
                                <span>{formatPrice(balance || 0)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
