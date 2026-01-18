
'use client';

import React, { createContext, useContext, useMemo, ReactNode, useState, useEffect } from 'react';
import type { Room, Stay, ServiceRequest, HotelService, Broadcast } from '@/lib/types';
import { useSettings } from './settings-context';
import { differenceInCalendarDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useServices } from './service-context';
import { useInventory } from './inventory-context';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { doc, collection, where, query, getDoc, arrayUnion } from 'firebase/firestore';
import { useHotelId } from './hotel-id-context';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

interface StayContextType {
  stay: Stay | undefined;
  room: Room | undefined;
  serviceLog: ServiceRequest[];
  broadcasts: Broadcast[];
  billSummary: {
    nights: number;
    roomTotal: number;
    servicesTotal: number;
    subtotal: number;
    serviceChargeRate: number;
    serviceChargeAmount: number;
    gstRate: number;
    gstAmount: number;
    totalWithTaxes: number;
    paidAmount: number;
    currentBalance: number;
  } | null;
  cart: CartItem[];
  updateCartItemQuantity: (service: HotelService, quantity: number) => void;
  isCartSheetOpen: boolean;
  setIsCartSheetOpen: (isOpen: boolean) => void;
  addServiceRequests: (requests: Omit<ServiceRequest, 'id'>[]) => void;
}

const StayContext = createContext<StayContextType | undefined>(undefined);

type CartItem = {
    service: HotelService;
    quantity: number;
};

export function StayProvider({ children, stayId }: { children: ReactNode; stayId: string }) {
  const firestore = useFirestore();
  const hotelId = useHotelId();
  const { addServiceRequests: addServiceRequestsToContext } = useServices();
  const { gstRate, serviceChargeRate } = useSettings();
  const { inventory, updateInventoryItem, addStockMovement } = useInventory();
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartSheetOpen, setIsCartSheetOpen] = useState(false);
  const [serviceLog, setServiceLog] = useState<ServiceRequest[]>([]);

  // This query is intentionally broad to work around Firestore's limitations on OR queries.
  // We fetch all active broadcasts and filter them on the client.
  const broadcastsQuery = useMemoFirebase(() => (
    firestore && hotelId ? query(collection(firestore, 'hotels', hotelId, 'broadcasts'), where('status', '==', 'Active')) : null
  ), [firestore, hotelId]);
  
  const { data: broadcastsData } = useCollection<Broadcast>(broadcastsQuery);

  const broadcasts = useMemo(() => {
    if (!broadcastsData) return [];
    return broadcastsData.map(b => ({
      ...b,
      startDate: (b.startDate as any)?.toDate ? (b.startDate as any).toDate() : new Date(b.startDate),
      endDate: (b.endDate as any)?.toDate ? (b.endDate as any).toDate() : new Date(b.endDate),
    }))
  }, [broadcastsData]);


  // Efficiently query for the room that contains the stay
   const roomsQuery = useMemoFirebase(() => (
    firestore && hotelId && stayId ? query(collection(firestore, 'hotels', hotelId, 'rooms'), where('stayId', '==', stayId)) : null
  ), [firestore, hotelId, stayId]);

  const { data: roomData } = useCollection<Room>(roomsQuery);
  
  const { room, stay } = useMemo(() => {
    if (!roomData || roomData.length === 0) return { room: undefined, stay: undefined };
    const foundRoom = roomData[0];
    const foundStay = foundRoom.stays.find(s => s.stayId === stayId);
    return { 
        room: {
            ...foundRoom,
            checkInDate: (foundRoom.checkInDate as any)?.toDate ? (foundRoom.checkInDate as any).toDate() : new Date(foundRoom.checkInDate!),
            checkOutDate: (foundRoom.checkOutDate as any)?.toDate ? (foundRoom.checkOutDate as any).toDate() : new Date(foundRoom.checkOutDate!),
        }, 
        stay: foundStay ? {
            ...foundStay,
            checkInDate: (foundStay.checkInDate as any)?.toDate ? (foundStay.checkInDate as any).toDate() : new Date(foundStay.checkInDate),
            checkOutDate: (foundStay.checkOutDate as any)?.toDate ? (foundStay.checkOutDate as any).toDate() : new Date(foundStay.checkOutDate),
        } : undefined
    };
  }, [roomData, stayId]);

  useEffect(() => {
    const fetchServiceRequests = async () => {
      if (!firestore || !hotelId || !stay?.serviceRequestIds || stay.serviceRequestIds.length === 0) {
        setServiceLog([]);
        return;
      }
      
      const requests: ServiceRequest[] = [];
      for (const id of stay.serviceRequestIds) {
        const reqRef = doc(firestore, 'hotels', hotelId, 'serviceRequests', id);
        try {
          const docSnap = await getDoc(reqRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as ServiceRequest;
            requests.push({ 
              ...data,
              id: docSnap.id,
              creationTime: (data.creationTime as any)?.toDate ? (data.creationTime as any).toDate() : new Date(data.creationTime),
              completionTime: data.completionTime && ((data.completionTime as any)?.toDate ? (data.completionTime as any).toDate() : new Date(data.completionTime)),
            });
          }
        } catch (error) {
          // This might be a permission error if the rule is not set up for get, but we'll handle it gracefully
          console.warn(`Could not fetch service request ${id}:`, error);
        }
      }
      setServiceLog(requests);
    };

    fetchServiceRequests();
  }, [stay, firestore, hotelId]);


  const billSummary = useMemo(() => {
    if (!stay) return null;
    const nights = differenceInCalendarDays(new Date(stay.checkOutDate), new Date(stay.checkInDate)) || 1;
    const roomTotal = stay.roomCharge * nights;
    const servicesTotal = serviceLog.reduce((sum, item) => sum + (item.price || 0), 0);
    const subtotal = roomTotal + servicesTotal;
    const serviceChargeAmount = (subtotal * serviceChargeRate) / 100;
    const gstAmount = (subtotal * gstRate) / 100;
    const totalWithTaxes = subtotal + serviceChargeAmount + gstAmount;
    const paidAmount = stay.paidAmount || 0;
    const currentBalance = totalWithTaxes - paidAmount;
    return {
        nights, roomTotal, servicesTotal, subtotal, serviceChargeRate,
        serviceChargeAmount, gstRate, gstAmount, totalWithTaxes, paidAmount, currentBalance
    };
  }, [stay, serviceLog, gstRate, serviceChargeRate]);

  const addServiceRequests = async (requests: Omit<ServiceRequest, 'id'>[]) => {
    if (!room || !stay || !firestore || !hotelId) return;

    const addedRequestIds = await addServiceRequestsToContext(requests);
    
    // Update the stay object with the new service request IDs
    const roomRef = doc(firestore, 'hotels', hotelId, 'rooms', room.id);
    const updatedServiceRequestIds = arrayUnion(...addedRequestIds);
    
    const newStaysArray = room.stays.map(s => {
      if (s.stayId === stayId) {
        return {
          ...s,
          serviceRequestIds: [...(s.serviceRequestIds || []), ...addedRequestIds]
        };
      }
      return s;
    });

    updateDocumentNonBlocking(roomRef, { stays: newStaysArray });

    requests.forEach((req, index) => {
      if (req.serviceId) {
        const service = hotelServices.find(s => s.id === req.serviceId);
        if (service && service.inventoryItemId && service.inventoryQuantityConsumed) {
          const inventoryItem = inventory.find(i => i.id === service.inventoryItemId);
          if (inventoryItem) {
            const quantityToDeduct = service.inventoryQuantityConsumed * (req.quantity || 1);
            updateInventoryItem(inventoryItem.id, { stock: inventoryItem.stock - quantityToDeduct });
            addStockMovement({
              itemId: inventoryItem.id,
              itemName: inventoryItem.name,
              type: 'Consumption',
              quantity: -quantityToDeduct,
              date: new Date(),
              notes: `Order for Room ${req.roomNumber}`
            });
          }
        }
      }
    });
  };

  const updateCartItemQuantity = (service: HotelService, newQuantity: number) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.service.id === service.id);
      if (newQuantity <= 0) {
        return prevCart.filter(item => item.service.id !== service.id);
      }
      if (existingItem) {
        return prevCart.map(item =>
          item.service.id === service.id ? { ...item, quantity: newQuantity } : item
        );
      }
      return [...prevCart, { service, quantity: newQuantity }];
    });
  };

  return (
    <StayContext.Provider value={{ 
        stay, room, serviceLog, billSummary, 
        cart, updateCartItemQuantity, isCartSheetOpen, setIsCartSheetOpen,
        addServiceRequests,
        broadcasts
    }}>
      {children}
    </StayContext.Provider>
  );
}

export function useStay() {
  const context = useContext(StayContext);
  if (context === undefined) {
    throw new Error('useStay must be used within a StayProvider');
  }
  return context;
}
