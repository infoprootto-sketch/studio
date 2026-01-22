'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import type { InventoryItem, StockMovement, Vendor } from '@/lib/types';
import { useFirestore, useCollection, useMemoFirebase, useUser, FirestorePermissionError, errorEmitter } from '@/firebase';
import { useHotelId } from './hotel-id-context';
import { collection, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { usePathname } from 'next/navigation';


interface InventoryContextType {
  inventory: InventoryItem[];
  stockMovements: StockMovement[];
  vendors: Vendor[];
  addInventoryItem: (itemData: Omit<InventoryItem, 'id'>) => Promise<string | null>;
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
  const pathname = usePathname();

  const isGuestPortal = pathname.startsWith('/guest');

  // Only fetch data if we are NOT in the guest portal and the user is logged in
  const shouldFetchData = useMemo(() => {
    return !isGuestPortal && !!firestore && !!hotelId && !!user && !isUserLoading;
  }, [isGuestPortal, firestore, hotelId, user, isUserLoading]);

  const inventoryCollectionRef = useMemoFirebase(() => {
    return shouldFetchData ? collection(firestore!, 'hotels', hotelId!, 'inventory') : null;
  }, [shouldFetchData, firestore, hotelId]);

  const vendorsCollectionRef = useMemoFirebase(() => {
    return shouldFetchData ? collection(firestore!, 'hotels', hotelId!, 'vendors') : null;
  }, [shouldFetchData, firestore, hotelId]);

  const stockMovementsCollectionRef = useMemoFirebase(() => {
    return shouldFetchData ? collection(firestore!, 'hotels', hotelId!, 'stockMovements') : null;
  }, [shouldFetchData, firestore, hotelId]);

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

  const addInventoryItem = async (itemData: Omit<InventoryItem, 'id'>): Promise<string | null> => {
    if (!inventoryCollectionRef) return null;
    try {
        const docRef = await addDoc(inventoryCollectionRef, itemData);
        return docRef.id;
    } catch (serverError) {
        const permissionError = new FirestorePermissionError({
          path: inventoryCollectionRef.path,
          operation: 'create',
          requestResourceData: itemData,
        });
        errorEmitter.emit('permission-error', permissionError);
        return null;
    }
  };
  
  const updateInventoryItem = (itemId: string, updates: Partial<InventoryItem>) => {
    if (!firestore || !hotelId) return;
    const itemRef = doc(firestore, 'hotels', hotelId, 'inventory', itemId);
    updateDoc(itemRef, updates).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: itemRef.path,
          operation: 'update',
          requestResourceData: updates,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const deleteInventoryItem = (itemId: string) => {
    if (!firestore || !hotelId) return;
    const itemRef = doc(firestore, 'hotels', hotelId, 'inventory', itemId);
    deleteDoc(itemRef).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: itemRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const addVendor = (vendorData: Omit<Vendor, 'id'>) => {
    if (!vendorsCollectionRef) return;
    addDoc(vendorsCollectionRef, vendorData).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: vendorsCollectionRef.path,
          operation: 'create',
          requestResourceData: vendorData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const updateVendor = (vendorId: string, updates: Partial<Vendor>) => {
    if (!firestore || !hotelId) return;
    const vendorRef = doc(firestore, 'hotels', hotelId, 'vendors', vendorId);
    updateDoc(vendorRef, updates).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: vendorRef.path,
          operation: 'update',
          requestResourceData: updates,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const deleteVendor = (vendorId: string) => {
    if (!firestore || !hotelId) return;
    const vendorRef = doc(firestore, 'hotels', hotelId, 'vendors', vendorId);
    deleteDoc(vendorRef).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: vendorRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const addStockMovement = (movementData: Omit<StockMovement, 'id'>) => {
    if (!stockMovementsCollectionRef) return;
    addDoc(stockMovementsCollectionRef, movementData).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: stockMovementsCollectionRef.path,
          operation: 'create',
          requestResourceData: movementData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
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
