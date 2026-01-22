
'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import type { CorporateClient, BilledOrder, CheckedOutStay } from '@/lib/types';
import { CorporateClientList } from '@/components/dashboard/corporate-client-list';
import { EditCorporateClientDialog } from '@/components/dashboard/edit-corporate-client-dialog';
import { useToast } from '@/hooks/use-toast';
import { StayHistoryDialog } from '@/components/dashboard/stay-history-dialog';
import { ClientBillingHistoryDialog } from '@/components/dashboard/client-billing-history-dialog';
import { useBilling } from '@/context/billing-context';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { useHotelId } from '@/context/hotel-id-context';
import { collection } from 'firebase/firestore';


export default function BillingPage() {
    const { addClient, updateClient, deleteClient, updateBilledOrder } = useBilling();
    
    const firestore = useFirestore();
    const hotelId = useHotelId();
    const { user, isUserLoading } = useUser();
    
    const checkoutHistoryCollectionRef = useMemoFirebase(() => (firestore && hotelId && user && !isUserLoading ? collection(firestore, 'hotels', hotelId, 'checkoutHistory') : null), [firestore, hotelId, user, isUserLoading]);
    const { data: checkoutHistoryData } = useCollection<CheckedOutStay>(checkoutHistoryCollectionRef);
    
    const clientsCollectionRef = useMemoFirebase(
      () => (firestore && hotelId ? collection(firestore, 'hotels', hotelId, 'corporateClients') : null),
      [firestore, hotelId]
    );
    const { data: rawCorporateClients = [] } = useCollection<CorporateClient>(clientsCollectionRef);

    const corporateClients = useMemo(() => {
        if (!rawCorporateClients) return [];
        return rawCorporateClients.map(client => ({
        ...client,
        billedOrders: (client.billedOrders || []).map(order => ({
            ...order,
            date: (order.date as any)?.toDate ? (order.date as any).toDate() : new Date(order.date),
            paidDate: order.paidDate && ((order.paidDate as any)?.toDate ? (order.paidDate as any).toDate() : new Date(order.paidDate)),
        })),
        }));
    }, [rawCorporateClients]);


    const checkoutHistory = useMemo(() => {
        if (!checkoutHistoryData) return [];
        return checkoutHistoryData.map(s => ({
            ...s, 
            checkInDate: (s.checkInDate as any)?.toDate ? (s.checkInDate as any).toDate() : new Date(s.checkInDate), 
            checkOutDate: (s.checkOutDate as any)?.toDate ? (s.checkOutDate as any).toDate() : new Date(s.checkOutDate)
        }));
    }, [checkoutHistoryData]);

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
    const [isBillingHistoryOpen, setIsBillingHistoryOpen] = useState(false);

    const [selectedClient, setSelectedClient] = useState<CorporateClient | null>(null);
    const [selectedStay, setSelectedStay] = useState<CheckedOutStay | null>(null);

    const { toast } = useToast();

    const handleOpenEditDialog = (client?: CorporateClient) => {
        setSelectedClient(client || null);
        setIsEditDialogOpen(true);
    };

    const handleCloseEditDialog = () => {
        setIsEditDialogOpen(false);
        setSelectedClient(null);
    };
    
    const handleOpenBillingHistoryDialog = (client: CorporateClient) => {
        setSelectedClient(client);
        setIsBillingHistoryOpen(true);
    };

    const handleCloseBillingHistoryDialog = () => {
        setIsBillingHistoryOpen(false);
        setSelectedClient(null);
    }

    const handleOpenStayDialog = (stayId: string) => {
        const stay = checkoutHistory.find(s => s.stayId === stayId);
        if (stay) {
            setSelectedStay(stay);
            setIsHistoryDialogOpen(true);
        } else {
            toast({
                variant: "destructive",
                title: "Stay Not Found",
                description: "The historical details for this stay could not be found."
            });
        }
    };
    
    const handleCloseStayDialog = () => {
        setIsHistoryDialogOpen(false);
        setSelectedStay(null);
    };

    const handleSaveClient = (clientData: Partial<CorporateClient>) => {
        if (clientData.id) {
            // Edit
            updateClient(clientData.id, clientData);
            toast({ title: "Client Updated", description: `${clientData.name} has been updated.` });
        } else {
            // Add
            addClient(clientData as Omit<CorporateClient, 'id' | 'billedOrders'>);
            toast({ title: "Client Added", description: `${clientData.name} has been added.` });
        }
    };

    const handleDeleteClient = (clientId: string) => {
        const clientName = corporateClients.find(c => c.id === clientId)?.name;
        deleteClient(clientId);
        toast({ title: "Client Deleted", description: `${clientName} has been removed.`, variant: "destructive" });
    };

    const handleMarkOrderAsPaid = (clientId: string, orderId: string) => {
        updateBilledOrder(clientId, orderId, { status: 'Paid' }, corporateClients);
        toast({ title: "Order Paid", description: "The order has been marked as paid." });
    };

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Corporate Clients</CardTitle>
                        <CardDescription>Manage corporate clients and their billing history.</CardDescription>
                    </div>
                    <Button onClick={() => handleOpenEditDialog()}>
                        <PlusCircle className="mr-2" /> Add Client
                    </Button>
                </CardHeader>
                <CardContent>
                    <CorporateClientList
                        clients={corporateClients}
                        onEdit={handleOpenEditDialog}
                        onDelete={handleDeleteClient}
                        onViewHistory={handleOpenBillingHistoryDialog}
                    />
                </CardContent>
            </Card>
            
            <EditCorporateClientDialog
                isOpen={isEditDialogOpen}
                onClose={handleCloseEditDialog}
                onSave={handleSaveClient}
                client={selectedClient}
            />
            
            <ClientBillingHistoryDialog
                isOpen={isBillingHistoryOpen}
                onClose={handleCloseBillingHistoryDialog}
                client={corporateClients.find(c => c.id === selectedClient?.id) || null}
                onMarkOrderAsPaid={handleMarkOrderAsPaid}
                onViewStayDetails={handleOpenStayDialog}
            />

            <StayHistoryDialog
                isOpen={isHistoryDialogOpen}
                onClose={handleCloseStayDialog}
                stay={selectedStay}
            />
        </>
    );
}
