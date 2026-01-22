
'use client';

import React, { createContext, useContext, useMemo, ReactNode, useState, useEffect } from 'react';
import type { Room, Stay, ServiceRequest, HotelService, Broadcast, ActiveStay } from '@/lib/types';
import { useSettings } from './settings-context';
import { differenceInCalendarDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useServices } from './service-context';
import { useInventory } from './inventory-context';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { doc, collection, where, query, getDoc, arrayUnion, limit } from 'firebase/firestore';
import { useHotelId } from './hotel-id-context';
import { useRouter } from 'next/navigation';
import { PageLoader } from '@/components/common/page-loader';


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
  const router = useRouter();
  const { hotelServices, addServiceRequests: addServiceRequestsToContext } = useServices();
  const { gstRate, serviceChargeRate } = useSettings();
  const { inventory, updateInventoryItem, addStockMovement } = useInventory();
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartSheetOpen, setIsCartSheetOpen] = useState(false);
  
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


  // Step 1: Fetch the activeStay document to get the roomId
  const activeStayRef = useMemoFirebase(() => (
    firestore && stayId ? doc(firestore, 'activeStays', stayId) : null
  ), [firestore, stayId]);

  const { data: activeStayData, isLoading: isLoadingActiveStay } = useDoc<ActiveStay>(activeStayRef);
  
  const roomId = activeStayData?.roomId;
  
  useEffect(() => {
    if (!isLoadingActiveStay && (!activeStayData || activeStayData.hotelId !== hotelId)) {
        // If loading is finished and there's no active stay data,
        // or if the hotelId doesn't match, the stay is invalid. Redirect.
        router.push('/guest/login');
    }
  }, [isLoadingActiveStay, activeStayData, hotelId, router]);


  // Step 2: Use the roomId to fetch the specific room document
  const roomRef = useMemoFirebase(() => (
    firestore && hotelId && roomId ? doc(firestore, 'hotels', hotelId, 'rooms', roomId) : null
  ), [firestore, hotelId, roomId]);

  const { data: roomData } = useDoc<Room>(roomRef);
  
  // Step 3: Extract the specific stay from the room document
  const { room, stay } = useMemo(() => {
    if (!roomData) return { room: undefined, stay: undefined };
    const foundStay = roomData.stays.find(s => s.stayId === stayId);
    return { 
        room: {
            ...roomData,
            checkInDate: (roomData.checkInDate as any)?.toDate ? (roomData.checkInDate as any).toDate() : new Date(roomData.checkInDate!),
            checkOutDate: (roomData.checkOutDate as any)?.toDate ? (roomData.checkOutDate as any).toDate() : new Date(roomData.checkOutDate!),
        }, 
        stay: foundStay ? {
            ...foundStay,
            checkInDate: (foundStay.checkInDate as any)?.toDate ? (foundStay.checkInDate as any).toDate() : new Date(foundStay.checkInDate),
            checkOutDate: (foundStay.checkOutDate as any)?.toDate ? (foundStay.checkOutDate as any).toDate() : new Date(foundStay.checkOutDate),
        } : undefined
    };
  }, [roomData, stayId]);
  
  const serviceRequestsQuery = useMemoFirebase(() => (
    firestore && hotelId && stayId ? query(collection(firestore, 'hotels', hotelId, 'serviceRequests'), where('stayId', '==', stayId), limit(50)) : null
  ), [firestore, hotelId, stayId]);

  const { data: serviceLogData } = useCollection<ServiceRequest>(serviceRequestsQuery);
  
  const serviceLog = useMemo(() => {
    if (!serviceLogData) return [];
    return serviceLogData.map(req => ({
      ...req,
      creationTime: (req.creationTime as any)?.toDate ? (req.creationTime as any).toDate() : new Date(req.creationTime),
      completionTime: req.completionTime && ((req.completionTime as any)?.toDate ? (req.completionTime as any).toDate() : new Date(req.completionTime)),
    }));
  }, [serviceLogData]);


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

    // This function now only creates the service request documents.
    // The link is established by the `stayId` field.
    const addedRequestIds = await addServiceRequestsToContext(requests);
    
    // Inventory logic remains the same.
    requests.forEach((req) => {
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
  
   if (isLoadingActiveStay || !activeStayData) {
      return <PageLoader />;
  }

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
