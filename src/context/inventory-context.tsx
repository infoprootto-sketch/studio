
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import type { InventoryItem, StockMovement, Vendor } from '@/lib/types';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { useHotelId } from './hotel-id-context';
import { collection, doc } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';


interface InventoryContextType {
  inventory: InventoryItem[];
  stockMovements: StockMovement[];
  vendors: Vendor[];
  addInventoryItem: (itemData: Omit<InventoryItem, 'id'>) => void;
  updateInventoryItem: (itemId: string, updates: Partial<InventoryItem>) => void;
  deleteInventoryItem: (itemId: string) => void;
  addVendor: (vendorData: Omit<Vendor, 'id'>) => void;
  updateVendor: (vendorId: string, updates: Partial<Vendor>) => void;
  deleteVendor: (vendorId: string) => void;
  addStockMovement: (movementData: Omit<StockMovement, 'id'>) => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const firestore = useFirestore();
  const hotelId = useHotelId();
  const { user, isUserLoading } = useUser();

  const inventoryCollectionRef = useMemoFirebase(() => (firestore && hotelId && user && !isUserLoading ? collection(firestore, 'hotels', hotelId, 'inventory') : null), [firestore, hotelId, user, isUserLoading]);
  const vendorsCollectionRef = useMemoFirebase(() => (firestore && hotelId && user && !isUserLoading ? collection(firestore, 'hotels', hotelId, 'vendors') : null), [firestore, hotelId, user, isUserLoading]);
  const stockMovementsCollectionRef = useMemoFirebase(() => (firestore && hotelId && user && !isUserLoading ? collection(firestore, 'hotels', hotelId, 'stockMovements') : null), [firestore, hotelId, user, isUserLoading]);

  const { data: inventory = [] } = useCollection<InventoryItem>(inventoryCollectionRef);
  const { data: vendors = [] } = useCollection<Vendor>(vendorsCollectionRef);
  const { data: stockMovementsData } = useCollection<StockMovement>(stockMovementsCollectionRef);

  const stockMovements = useMemo(() => {
    if (!stockMovementsData) return [];
    return stockMovementsData.map(m => ({
      ...m,
      date: (m.date as any)?.toDate ? (m.date as any).toDate() : new Date(m.date),
    }));
  }, [stockMovementsData]);

  const addInventoryItem = (itemData: Omit<InventoryItem, 'id'>) => {
    if (!inventoryCollectionRef) return;
    addDocumentNonBlocking(inventoryCollectionRef, itemData);
  };
  
  const updateInventoryItem = (itemId: string, updates: Partial<InventoryItem>) => {
    if (!firestore || !hotelId) return;
    const itemRef = doc(firestore, 'hotels', hotelId, 'inventory', itemId);
    updateDocumentNonBlocking(itemRef, updates);
  };

  const deleteInventoryItem = (itemId: string) => {
    if (!firestore || !hotelId) return;
    const itemRef = doc(firestore, 'hotels', hotelId, 'inventory', itemId);
    deleteDocumentNonBlocking(itemRef);
  };

  const addVendor = (vendorData: Omit<Vendor, 'id'>) => {
    if (!vendorsCollectionRef) return;
    addDocumentNonBlocking(vendorsCollectionRef, vendorData);
  };

  const updateVendor = (vendorId: string, updates: Partial<Vendor>) => {
    if (!firestore || !hotelId) return;
    const vendorRef = doc(firestore, 'hotels', hotelId, 'vendors', vendorId);
    updateDocumentNonBlocking(vendorRef, updates);
  };

  const deleteVendor = (vendorId: string) => {
    if (!firestore || !hotelId) return;
    const vendorRef = doc(firestore, 'hotels', hotelId, 'vendors', vendorId);
    deleteDocumentNonBlocking(vendorRef);
  };

  const addStockMovement = (movementData: Omit<StockMovement, 'id'>) => {
    if (!stockMovementsCollectionRef) return;
    addDocumentNonBlocking(stockMovementsCollectionRef, movementData);
  };


  const value = {
    inventory: inventory || [],
    stockMovements,
    vendors: vendors || [],
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    addVendor,
    updateVendor,
    deleteVendor,
    addStockMovement
  };


  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}
