
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import type { CorporateClient, BilledOrder } from '@/lib/types';
import { useFirestore, useCollection, useMemoFirebase, useUser, FirestorePermissionError, errorEmitter } from '@/firebase';
import { useHotelId } from './hotel-id-context';
import { collection, doc, addDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';

interface BillingContextType {
  corporateClients: CorporateClient[];
  addClient: (clientData: Omit<CorporateClient, 'id' | 'billedOrders'>) => void;
  updateClient: (clientId: string, updates: Partial<CorporateClient>) => void;
  deleteClient: (clientId: string) => void;
  addBilledOrder: (clientId: string, order: Omit<BilledOrder, 'id'>) => void;
  updateBilledOrder: (clientId: string, orderId: string, updates: Partial<BilledOrder>) => void;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

export function BillingProvider({ children }: { children: ReactNode }) {
  const firestore = useFirestore();
  const hotelId = useHotelId();
  const { user, isUserLoading } = useUser();

  const clientsCollectionRef = useMemoFirebase(
    () => (firestore && hotelId && user && !isUserLoading ? collection(firestore, 'hotels', hotelId, 'corporateClients') : null),
    [firestore, hotelId, user, isUserLoading]
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

  const addClient = (clientData: Omit<CorporateClient, 'id' | 'billedOrders'>) => {
    if (!clientsCollectionRef) return;
    const newClientData: Omit<CorporateClient, 'id'> = {
      ...clientData,
      billedOrders: [],
    };
    addDocumentNonBlocking(clientsCollectionRef, newClientData);
  };
  
  const updateClient = (clientId: string, updates: Partial<CorporateClient>) => {
    if (!firestore || !hotelId) return;
    const clientRef = doc(firestore, 'hotels', hotelId, 'corporateClients', clientId);
    updateDocumentNonBlocking(clientRef, updates);
  };

  const deleteClient = (clientId: string) => {
    if (!firestore || !hotelId) return;
    const clientRef = doc(firestore, 'hotels', hotelId, 'corporateClients', clientId);
    deleteDocumentNonBlocking(clientRef);
  };

  const addBilledOrder = (clientId: string, order: Omit<BilledOrder, 'id'>) => {
    if (!firestore || !hotelId) return;
    const clientRef = doc(firestore, 'hotels', hotelId, 'corporateClients', clientId);
    const newOrder = { ...order, id: `bo-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` };
    updateDocumentNonBlocking(clientRef, { billedOrders: arrayUnion(newOrder) });
  };
  
  const updateBilledOrder = (clientId: string, orderId: string, updates: Partial<BilledOrder>) => {
    if (!firestore || !hotelId || !corporateClients) return;
    const client = corporateClients.find(c => c.id === clientId);
    if (!client || !client.billedOrders) return;

    const finalUpdates = { ...updates };
    if (updates.status === 'Paid' && !updates.paidDate) {
      finalUpdates.paidDate = new Date();
    }

    const updatedOrders = client.billedOrders.map(order => 
      order.id === orderId ? { ...order, ...finalUpdates } : order
    );

    const clientRef = doc(firestore, 'hotels', hotelId, 'corporateClients', clientId);
    const updatedData = { billedOrders: updatedOrders };

    updateDoc(clientRef, updatedData)
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: clientRef.path,
          operation: 'update',
          requestResourceData: updatedData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };
  
  const value = {
      corporateClients: corporateClients || [],
      addClient,
      updateClient,
      deleteClient,
      addBilledOrder,
      updateBilledOrder,
  };

  return (
    <BillingContext.Provider value={value}>
      {children}
    </BillingContext.Provider>
  );
}

export function useBilling() {
  const context = useContext(BillingContext);
  if (context === undefined) {
    throw new Error('useBilling must be used within a BillingProvider');
  }
  return context;
}
