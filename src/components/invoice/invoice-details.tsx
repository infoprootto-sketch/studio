

'use client';

import { useStay } from "@/context/stay-context";
import { useSettings } from "@/context/settings-context";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { format } from "date-fns";
import { Button } from "../ui/button";
import { Printer } from "lucide-react";
import { useRooms } from "@/context/room-context";
import { useEffect, useMemo } from "react";
import { Logo } from "../logo";
import type { ServiceRequest } from "@/lib/types";

export function InvoiceDetails() {
    const { stay, room, serviceLog } = useStay();
    const { checkoutHistory } = useRooms();
    const { formatPrice, legalName, address, gstNumber, gstRate, serviceChargeRate } = useSettings();

    const historicalStay = useMemo(() => {
        if (!stay && room?.stayId) {
            return checkoutHistory.find(s => s.stayId === room.stayId);
        }
        return null;
    }, [stay, room, checkoutHistory]);

    const billDetails = useMemo(() => {
        const processBill = (currentStay: any, currentRoom: any, log: ServiceRequest[], finalBill?: any) => {
            if (finalBill) { // Is a historical stay with a final bill
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

                return {
                    guestName: currentStay.guestName,
                    checkInDate: (currentStay.checkInDate as any)?.toDate ? (currentStay.checkInDate as any).toDate() : new Date(currentStay.checkInDate),
                    checkOutDate: (currentStay.checkOutDate as any)?.toDate ? (currentStay.checkOutDate as any).toDate() : new Date(currentStay.checkOutDate),
                    roomNumber: currentStay.roomNumber,
                    roomType: currentStay.roomType,
                    ...finalBill,
                    serviceCharges: Object.values(groupedServiceCharges),
                    balance: finalBill.total - finalBill.paidAmount,
                };
            }

            // Is an active stay
            const nights = currentStay.checkInDate && currentStay.checkOutDate ? Math.max(1, (new Date(currentStay.checkOutDate).getTime() - new Date(currentStay.checkInDate).getTime()) / (1000 * 3600 * 24)) : 0;
            const roomTotal = (currentStay.roomCharge || 0) * nights;
            const servicesTotal = log.reduce((sum, item) => sum + (item.price || 0), 0);
            const subtotal = roomTotal + servicesTotal;
            const serviceChargeAmount = (subtotal * serviceChargeRate) / 100;
            const gstAmount = (subtotal * gstRate) / 100;
            const total = subtotal + serviceChargeAmount + gstAmount;
            const paid = currentStay.paidAmount || 0;
            const balance = total - paid;
             const groupedServiceCharges = log.reduce((acc: any, item: any) => {
                    const serviceName = item.service.replace(/ \(x\d+\)$/, '').trim();
                    if (!acc[serviceName]) {
                        acc[serviceName] = { ...item, quantity: 0, total: 0 };
                    }
                    acc[serviceName].quantity += item.quantity || 1;
                    acc[serviceName].total += item.price || 0;
                     acc[serviceName].price = item.price && item.quantity ? item.price / item.quantity : item.price;
                    return acc;
                }, {});

            return {
                guestName: currentStay.guestName,
                checkInDate: (currentStay.checkInDate as any)?.toDate ? (currentStay.checkInDate as any).toDate() : new Date(currentStay.checkInDate),
                checkOutDate: (currentStay.checkOutDate as any)?.toDate ? (currentStay.checkOutDate as any).toDate() : new Date(currentStay.checkOutDate),
                roomNumber: currentRoom?.number,
                roomType: currentRoom?.type,
                roomCharges: { label: `${currentRoom?.type} (${nights} nights)`, amount: roomTotal },
                serviceCharges: Object.values(groupedServiceCharges),
                subtotal,
                serviceChargeAmount,
                gstAmount,
                paidAmount: paid,
                total,
                balance,
                paymentMethod: currentStay.isBilledToCompany ? 'Billed to Company' : (balance <= 0 ? 'Paid in Full' : 'Pending Payment'),
            };
        };

        if (stay) {
            return processBill(stay, room, serviceLog);
        }
        if (historicalStay) {
            return processBill(historicalStay, null, historicalStay.finalBill.serviceCharges, historicalStay.finalBill);
        }
        return null;
    }, [stay, historicalStay, room, serviceLog, gstRate, serviceChargeRate]);

    useEffect(() => {
        if(billDetails) {
            setTimeout(() => window.print(), 500);
        }
    }, [billDetails]);


    if (!billDetails) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <Card className="w-full max-w-4xl">
                    <CardHeader>
                        <CardTitle>Invoice Not Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>The details for this stay could not be found.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const {
        guestName, checkInDate, checkOutDate, roomNumber, roomType,
        roomCharges, serviceCharges, subtotal, serviceChargeAmount,
        gstAmount, paidAmount, total, balance
    } = billDetails;

    return (
        <div className="bg-gray-100 dark:bg-gray-900 p-4 sm:p-8 print:p-0 print:bg-white">
            <Card className="w-full max-w-4xl mx-auto shadow-lg print:shadow-none print:border-none">
                <CardHeader className="bg-muted/30 p-6 print:bg-gray-100">
                    <div className="flex flex-col sm:flex-row justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold font-headline">Invoice</h1>
                            <p className="text-muted-foreground">Stay ID: {stay?.stayId || historicalStay?.stayId}</p>
                        </div>
                        <div className="text-left sm:text-right mt-4 sm:mt-0">
                            <h2 className="text-lg font-semibold">{legalName}</h2>
                            <p className="text-sm text-muted-foreground">{address}</p>
                            <p className="text-sm text-muted-foreground">GSTIN: {gstNumber}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
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
                                <TableCell className="font-mono">{formatPrice(roomCharges.amount)}</TableCell>
                                <TableCell className="text-right font-mono">{formatPrice(roomCharges.amount)}</TableCell>
                            </TableRow>
                            {serviceCharges.map((item: any, index: number) => (
                                <TableRow key={item.id || index}>
                                    <TableCell className="text-muted-foreground">{item.service}</TableCell>
                                    <TableCell>{item.quantity}</TableCell>
                                    <TableCell className="font-mono">{formatPrice(item.price)}</TableCell>
                                    <TableCell className="text-right font-mono">{formatPrice(item.total)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <div className="flex justify-end mt-4">
                        <div className="w-full max-w-sm space-y-2">
                            <Separator />
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span className="font-mono">{formatPrice(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                                <span>Service Charge ({serviceChargeRate}%)</span>
                                <span className="font-mono">{formatPrice(serviceChargeAmount)}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                                <span>GST ({gstRate}%)</span>
                                <span className="font-mono">{formatPrice(gstAmount)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span className="font-mono">{formatPrice(total)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Amount Paid</span>
                                <span className="font-mono text-green-600 dark:text-green-400">-{formatPrice(paidAmount)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold text-xl">
                                <span>Balance Due</span>
                                <span className="font-mono">{formatPrice(balance)}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="justify-end p-6 print:hidden">
                    <Button onClick={() => window.print()}><Printer className="mr-2" /> Print Invoice</Button>
                </CardFooter>
            </Card>
        </div>
    );
}
