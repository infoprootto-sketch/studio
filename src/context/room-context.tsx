

'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect } from 'react';
import type { 
    Room, Stay, CheckedOutStay, RoomStatus,
    RoomCategory,
    FinalBill,
    ServiceRequest,
    Hotel,
} from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { useHotelId } from './hotel-id-context';
import { collection, doc, arrayUnion, arrayRemove, serverTimestamp, writeBatch, runTransaction, increment } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { getRoomDisplayStatus, isToday } from '@/lib/utils';
import { useServices } from './service-context';

interface GroupBookingDetails {
    primaryGuestName: string;
    primaryGuestNumber: string;
    checkInDate: Date;
    checkOutDate: Date;
    isClubbed: boolean;
    primaryRoomId?: string;
}

interface RoomAssignment {
    roomId: string;
    guestName: string;
    guestNumber: string;
    roomCharge: number;
}


interface Movement {
  room: Room;
  stay: Stay;
}

// Split contexts for performance optimization
interface RoomStateContextType {
  rooms: Room[];
  checkoutHistory: CheckedOutStay[];
  roomCategories: RoomCategory[];
  todaysArrivals: Movement[];
  todaysDepartures: Movement[];
  isManageRoomOpen: boolean;
  selectedRoom: Room | null;
  selectedStayId?: string;
  selectedDate?: Date;
  dialogAction: 'manage' | 'check-in' | 'clean' | 'out-of-order';
}

interface RoomActionsContextType {
  updateRoom: (roomId: string, updates: Partial<Room>) => void;
  addRooms: (rooms: (Partial<Room>)[]) => void;
  deleteRoom: (roomId: string) => void;
  addStay: (roomId: string, stayData: Omit<Stay, 'stayId' | 'status'>) => void;
  addGroupBooking: (groupDetails: GroupBookingDetails, assignments: RoomAssignment[]) => void;
  updateStay: (roomId: string, stayId: string, updates: Partial<Stay>) => void;
  removeStay: (roomId: string, stayId: string) => Promise<void>;
  checkInStay: (roomId: string, stayId: string) => void;
  archiveStay: (room: Room, stay: Stay, finalBill: FinalBill) => Promise<void>;
  addCategory: (categoryData: Omit<RoomCategory, 'id'>) => void;
  updateCategory: (categoryId: string, updates: Partial<RoomCategory>) => void;
  deleteCategory: (categoryId: string) => void;
  openManageRoom: (room: Room | null, stayId?: string, date?: Date, action?: RoomStateContextType['dialogAction']) => void;
  closeManageRoom: () => void;
}

const RoomStateContext = createContext<RoomStateContextType | undefined>(undefined);
const RoomActionsContext = createContext<RoomActionsContextType | undefined>(undefined);

const RoomProviderInternal = React.memo(({ children }: { children: ReactNode }) => {
  const firestore = useFirestore();
  const hotelId = useHotelId();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const { addServiceRequests } = useServices();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const roomsCollectionRef = useMemoFirebase(() => (firestore && hotelId && user && !isUserLoading ? collection(firestore, 'hotels', hotelId, 'rooms') : null), [firestore, hotelId, user, isUserLoading]);
  const checkoutHistoryCollectionRef = useMemoFirebase(() => (firestore && hotelId && user && !isUserLoading ? collection(firestore, 'hotels', hotelId, 'checkoutHistory') : null), [firestore, hotelId, user, isUserLoading]);
  const roomCategoriesCollectionRef = useMemoFirebase(() => (firestore && hotelId && user && !isUserLoading ? collection(firestore, 'hotels', hotelId, 'roomCategories') : null), [firestore, hotelId, user, isUserLoading]);

  const { data: firestoreRooms } = useCollection<Room>(roomsCollectionRef);

  const [rooms, setRooms] = useState<Room[]>([]);

  const baseRooms = useMemo(() => {
    if (!firestoreRooms) return [];
    return firestoreRooms.map(room => {
      const stays = (room.stays || []).map(stay => ({
          ...stay,
          checkInDate: (stay.checkInDate as any)?.toDate ? (stay.checkInDate as any).toDate() : new Date(stay.checkInDate),
          checkOutDate: (stay.checkOutDate as any)?.toDate ? (stay.checkOutDate as any).toDate() : new Date(stay.checkOutDate),
      }));
      const outOfOrderBlocks = (room.outOfOrderBlocks || []).map(block => ({
          ...block,
          from: (block.from as any)?.toDate ? (block.from as any).toDate() : new Date(block.from),
          to: (block.to as any)?.toDate ? (block.to as any).toDate() : new Date(block.to),
      }));
      
      return { ...room, stays, outOfOrderBlocks } as Room;
    });
  }, [firestoreRooms]);

  useEffect(() => {
    if (isClient) {
        const now = new Date();
        const roomsWithDisplayStatus = baseRooms.map(room => ({
            ...room,
            displayStatus: getRoomDisplayStatus(room, now),
        }));
        setRooms(roomsWithDisplayStatus);
    } else {
        setRooms(baseRooms);
    }
  }, [baseRooms, isClient]);


  const { data: checkoutHistoryData } = useCollection<CheckedOutStay>(checkoutHistoryCollectionRef);
  const { data: roomCategoriesData } = useCollection<RoomCategory>(roomCategoriesCollectionRef);

  const checkoutHistory = useMemo(() => (checkoutHistoryData || []).map(s => ({...s, checkInDate: (s.checkInDate as any)?.toDate ? (s.checkInDate as any).toDate() : new Date(s.checkInDate), checkOutDate: (s.checkOutDate as any)?.toDate ? (s.checkOutDate as any).toDate() : new Date(s.checkOutDate)})), [checkoutHistoryData]);
  const roomCategories = useMemo(() => roomCategoriesData || [], [roomCategoriesData]);

  const { todaysArrivals, todaysDepartures } = useMemo(() => {
    if (!isClient) return { todaysArrivals: [], todaysDepartures: [] };

    const arrivals: Movement[] = [];
    const departures: Movement[] = [];

    rooms.forEach(room => {
      (room.stays || []).forEach(stay => {
        if (isToday(new Date(stay.checkInDate)) && stay.status !== 'Checked In') {
          arrivals.push({ room, stay });
        }
        if (isToday(new Date(stay.checkOutDate)) && room.status === 'Occupied' && stay.status === 'Checked In') {
          departures.push({ room, stay });
        }
      });
    });
    return { todaysArrivals: arrivals, todaysDepartures: departures };
  }, [rooms, isClient]);

  const [isManageRoomOpen, setIsManageRoomOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedStayId, setSelectedStayId] = useState<string | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [dialogAction, setDialogAction] = useState<RoomStateContextType['dialogAction']>('manage');

  const openManageRoom = useCallback((room: Room | null, stayId?: string, date?: Date, action: RoomStateContextType['dialogAction'] = 'manage') => {
    setSelectedRoom(room);
    setSelectedStayId(stayId);
    setSelectedDate(date);
    setDialogAction(action);
    setIsManageRoomOpen(true);
  }, []);

  const closeManageRoom = useCallback(() => {
    setIsManageRoomOpen(false);
    setTimeout(() => {
      setSelectedRoom(null);
      setSelectedStayId(undefined);
      setSelectedDate(undefined);
    }, 300);
  }, []);

  const updateRoom = useCallback((roomId: string, updates: Partial<Room>) => {
    if (!firestore || !hotelId) return;
    const roomRef = doc(firestore, 'hotels', hotelId, 'rooms', roomId);
    updateDocumentNonBlocking(roomRef, updates);
  },[firestore, hotelId]);

  const addRooms = useCallback(async (roomsToAdd: (Partial<Room>)[]) => {
    if (!firestore || !hotelId) return;

    const hotelRef = doc(firestore, 'hotels', hotelId);

    try {
        await runTransaction(firestore, async (transaction) => {
            const hotelDoc = await transaction.get(hotelRef);
            if (!hotelDoc.exists()) {
                throw new Error("Hotel not found!");
            }

            for (const room of roomsToAdd) {
                 const newRoomRef = doc(collection(firestore, 'hotels', hotelId, 'rooms'));
                 const newRoomData: Omit<Room, 'id' | 'displayStatus'> = {
                    number: room.number!,
                    type: room.type!,
                    status: 'Available',
                    stays: [],
                };
                transaction.set(newRoomRef, newRoomData);
            }
            
            transaction.update(hotelRef, { roomCount: increment(roomsToAdd.length) });
        });
    } catch (e) {
        console.error("Add rooms transaction failed: ", e);
        toast({ variant: 'destructive', title: 'Error Adding Rooms', description: 'Could not add new rooms.'});
    }
  },[firestore, hotelId, toast]);
  
  const deleteRoom = useCallback(async (roomId: string) => {
    if (!firestore || !hotelId) return;
    
    const hotelRef = doc(firestore, 'hotels', hotelId);
    const roomRef = doc(firestore, 'hotels', hotelId, 'rooms', roomId);

    try {
      await runTransaction(firestore, async (transaction) => {
        const roomDoc = await transaction.get(roomRef);
        if (!roomDoc.exists()) {
          throw new Error("Room not found");
        }
        transaction.delete(roomRef);
        transaction.update(hotelRef, { roomCount: increment(-1) });
      });
    } catch (e) {
        console.error("Delete room transaction failed: ", e);
        toast({ variant: 'destructive', title: 'Error Deleting Room' });
    }
  },[firestore, hotelId, toast]);

  const addStay = useCallback((roomId: string, stayData: Omit<Stay, 'stayId' | 'status'>) => {
    if (!firestore || !hotelId) return;
    const roomRef = doc(firestore, 'hotels', hotelId, 'rooms', roomId);
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    const shortId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newStay: Stay = {
      ...stayData,
      guestNumber: stayData.guestNumber || null,
      status: 'Booked',
      stayId: `${room.number}-${shortId}`,
    };
    updateDocumentNonBlocking(roomRef, { stays: arrayUnion(newStay) });
  },[firestore, hotelId, rooms]);

  const addGroupBooking = useCallback((groupDetails: GroupBookingDetails, assignments: RoomAssignment[]) => {
    if (!firestore || !hotelId) return;
    const masterStayId = `GROUP-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    assignments.forEach(assignment => {
        const room = rooms.find(r => r.id === assignment.roomId);
        if (!room) return;
        
        const shortId = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        const newStay: Stay = {
            guestName: assignment.guestName,
            guestNumber: assignment.guestNumber || groupDetails.primaryGuestNumber || null,
            roomCharge: assignment.roomCharge,
            checkInDate: groupDetails.checkInDate,
            checkOutDate: groupDetails.checkOutDate,
            status: 'Booked',
            isGroupBooking: true,
            isPrimaryInGroup: (groupDetails.isClubbed && groupDetails.primaryRoomId === room.id) || false,
            stayId: `${room.number}-${shortId}`,
            ...(groupDetails.isClubbed && { groupMasterStayId: masterStayId })
        };

        const roomRef = doc(firestore, 'hotels', hotelId, 'rooms', assignment.roomId);
        updateDocumentNonBlocking(roomRef, { stays: arrayUnion(newStay) });
    });
  }, [firestore, hotelId, rooms]);


  const updateStay = useCallback((roomId: string, stayId: string, updates: Partial<Stay>) => {
    if (!firestore || !hotelId) return;
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    const stayToUpdate = room.stays.find(s => s.stayId === stayId);
    if (!stayToUpdate) return;
    
    const updatedStay = { ...stayToUpdate, ...updates };
    const otherStays = room.stays.filter(s => s.stayId !== stayId);

    const roomRef = doc(firestore, 'hotels', hotelId, 'rooms', roomId);
    updateDocumentNonBlocking(roomRef, { stays: [...otherStays, updatedStay] });
  },[firestore, hotelId, rooms]);
  
  const removeStay = useCallback(async (roomId: string, stayId: string) => {
    if (!firestore || !hotelId) return;
    const roomRef = doc(firestore, 'hotels', hotelId, 'rooms', roomId);
    const activeStayRef = doc(firestore, 'activeStays', stayId);
    
    try {
        await runTransaction(firestore, async (transaction) => {
            const roomDoc = await transaction.get(roomRef);
            if (!roomDoc.exists()) {
                throw new Error("Room does not exist!");
            }
            const currentRoomData = roomDoc.data() as Room;

            const stayToRemove = (currentRoomData.stays || []).find(s => s.stayId === stayId);
            if (!stayToRemove) {
                console.warn(`Stay ${stayId} to remove not found in room ${roomId}. It might have been removed already.`);
                return;
            }
            
            const newStaysArray = (currentRoomData.stays || []).filter(s => s.stayId !== stayId);

            transaction.update(roomRef, {
                stays: newStaysArray,
                guestName: null,
                stayId: null,
                checkInDate: null,
            });
            
            transaction.delete(activeStayRef);
        });
    } catch (e) {
        console.error("Remove stay transaction failed:", e);
        toast({
            variant: "destructive",
            title: "Cancellation Failed",
            description: "Could not remove the booking. Please try again.",
        });
    }
  }, [firestore, hotelId, toast]);


  const checkInStay = useCallback((roomId: string, stayId: string) => {
    if (!firestore || !hotelId) return;
    const room = rooms.find(r => r.id === roomId);
    const stay = room?.stays.find(s => s.stayId === stayId);
    if (!room || !stay) return;
    
    runTransaction(firestore, async (transaction) => {
      const roomRef = doc(firestore, 'hotels', hotelId, 'rooms', roomId);
      const activeStayRef = doc(firestore, 'activeStays', stay.stayId);

      const roomDoc = await transaction.get(roomRef);
      if (!roomDoc.exists()) {
        throw "Room does not exist!";
      }

      const currentRoomData = roomDoc.data() as Room;
      const stayToUpdate = currentRoomData.stays.find(s => s.stayId === stayId);
      if (!stayToUpdate) {
        throw "Stay not found in room!";
      }

      const updatedStay = { ...stayToUpdate, status: 'Checked In' as const };
      const otherStays = currentRoomData.stays.filter(s => s.stayId !== stayId);

      transaction.update(roomRef, {
        stays: [...otherStays, updatedStay],
        guestName: updatedStay.guestName,
        stayId: updatedStay.stayId,
        checkInDate: updatedStay.checkInDate,
        checkOutDate: updatedStay.checkOutDate,
        status: 'Occupied'
      });
      
      transaction.set(activeStayRef, { hotelId, roomNumber: room.number, roomId: room.id }, { merge: true });
    }).then(() => {
        toast({
            title: "Guest Checked In",
            description: `${stay.guestName} has been checked into Room ${room.number}.`
        });
    }).catch((error) => {
        console.error("Check-in transaction failed: ", error);
        toast({
            variant: "destructive",
            title: "Check-in Failed",
            description: "Could not check in the guest. Please try again.",
        });
    });
  },[firestore, hotelId, rooms, toast]);

  const archiveStay = useCallback(async (room: Room, stay: Stay, finalBill: FinalBill) => {
    if (!firestore || !hotelId) return;

    const checkoutTimestamp = new Date(); // Use a single timestamp for consistency

    const roomRef = doc(firestore, 'hotels', hotelId, 'rooms', room.id);
    const historyCollectionRef = collection(firestore, 'hotels', hotelId, 'checkoutHistory');
    const serviceRequestCollectionRef = collection(firestore, 'hotels', hotelId, 'serviceRequests');
    const activeStayRef = doc(firestore, 'activeStays', stay.stayId);

    try {
        await runTransaction(firestore, async (transaction) => {
            const roomDoc = await transaction.get(roomRef);
            if (!roomDoc.exists()) {
                throw new Error("Room does not exist!");
            }
            const currentRoomData = roomDoc.data() as Room;

            const stayExists = (currentRoomData.stays || []).some(s => s.stayId === stay.stayId);
            if (!stayExists) {
                // If the stay is already gone, it means checkout has already happened.
                // Throw a specific error to be caught and handled gracefully.
                throw new Error("ALREADY_CHECKED_OUT");
            }

            const sanitizedBill: FinalBill = {
                roomCharges: {
                    label: finalBill.roomCharges?.label || 'Room Charge',
                    amount: finalBill.roomCharges?.amount ?? 0,
                },
                serviceCharges: (finalBill.serviceCharges || []).map(sc => ({
                    id: sc.id || `sc-${Date.now()}`,
                    stayId: sc.stayId || stay.stayId,
                    roomNumber: sc.roomNumber || room.number,
                    service: sc.service || 'Unknown Service',
                    status: sc.status || 'Completed',
                    time: sc.time || 'N/A',
                    creationTime: sc.creationTime || checkoutTimestamp,
                    completionTime: sc.completionTime || null,
                    staff: sc.staff || 'N/A',
                    assignedTo: sc.assignedTo || null,
                    createdBy: sc.createdBy || null,
                    isManualCharge: sc.isManualCharge || false,
                    price: sc.price ?? 0,
                    category: sc.category || 'Other',
                    serviceId: sc.serviceId || null,
                    quantity: sc.quantity || 1,
                })),
                subtotal: finalBill.subtotal ?? 0,
                serviceChargeAmount: finalBill.serviceChargeAmount ?? 0,
                gstAmount: finalBill.gstAmount ?? 0,
                paidAmount: finalBill.paidAmount ?? 0,
                discount: finalBill.discount ?? 0,
                total: finalBill.total ?? 0,
                paymentMethod: finalBill.paymentMethod || 'Unknown',
            };

            const checkedOutStay: Omit<CheckedOutStay, 'id'> = {
              stayId: stay.stayId,
              roomNumber: room.number,
              roomType: room.type,
              guestName: stay.guestName,
              checkInDate: stay.checkInDate,
              checkOutDate: checkoutTimestamp, // Use consistent timestamp
              finalBill: sanitizedBill,
            };
            
            const cleaningRequest: Omit<ServiceRequest, 'id'> = {
              stayId: stay.stayId,
              roomNumber: room.number,
              service: 'Post-Checkout Cleaning',
              status: 'Pending',
              time: 'Now',
              creationTime: checkoutTimestamp, // Use consistent timestamp
              staff: 'Housekeeping',
              price: 0,
              category: 'Housekeeping Services',
              isManualCharge: true,
              createdBy: 'system'
            };

            if (finalBill.total > 0 || (finalBill.total === 0 && stay.isBilledToCompany)) {
                const historyDocRef = doc(historyCollectionRef);
                transaction.set(historyDocRef, checkedOutStay);
            }
            
            const cleaningRequestRef = doc(serviceRequestCollectionRef);
            transaction.set(cleaningRequestRef, cleaningRequest);
            
            transaction.delete(activeStayRef);

            const newStaysArray = (currentRoomData.stays || []).filter(s => s.stayId !== stay.stayId);
            transaction.update(roomRef, {
                stays: newStaysArray,
                guestName: null,
                stayId: null,
                checkInDate: null,
                status: 'Cleaning',
                checkOutDate: checkoutTimestamp, // Use consistent timestamp
            });
        });

        toast({
            title: "Guest Checked Out",
            description: `${stay.guestName} has been successfully checked out from Room ${room.number}.`
        });

    } catch (e: any) {
        if (e.message === "ALREADY_CHECKED_OUT") {
            toast({
                title: "Already Checked Out",
                description: `${stay.guestName} has already been checked out.`
            });
        } else {
            console.error("Checkout transaction failed: ", e);
            toast({
                variant: "destructive",
                title: "Checkout Failed",
                description: "A problem occurred during checkout, possibly due to conflicting operations. Please try again.",
            });
        }
    }
  }, [firestore, hotelId, toast, addServiceRequests]);

  const addCategory = useCallback((categoryData: Omit<RoomCategory, 'id'>) => {
    if (!roomCategoriesCollectionRef) return;
    addDocumentNonBlocking(roomCategoriesCollectionRef, categoryData);
  },[roomCategoriesCollectionRef]);
  
  const updateCategory = useCallback(async (categoryId: string, updates: Partial<RoomCategory>) => {
    if (!firestore || !hotelId || !roomCategories) return;

    const categoryRef = doc(firestore, 'hotels', hotelId, 'roomCategories', categoryId);
    
    const oldCategory = roomCategories.find(c => c.id === categoryId);

    if (updates.name && oldCategory && oldCategory.name !== updates.name) {
        const batch = writeBatch(firestore);
        
        const roomsToUpdate = rooms.filter(r => r.type === oldCategory.name);
        roomsToUpdate.forEach(room => {
            const roomRef = doc(firestore, 'hotels', hotelId, 'rooms', room.id);
            batch.update(roomRef, { type: updates.name });
        });
        
        batch.update(categoryRef, updates);
        
        await batch.commit();
    } else {
        updateDocumentNonBlocking(categoryRef, updates);
    }
  },[firestore, hotelId, rooms, roomCategories]);

  const deleteCategory = useCallback((categoryId: string) => {
    if (!firestore || !hotelId) return;

    const categoryToDelete = roomCategories.find(c => c.id === categoryId);
    if (!categoryToDelete) return;

    const roomsInUse = rooms.filter(room => room.type === categoryToDelete.name);
    if (roomsInUse.length > 0) {
      toast({
        variant: "destructive",
        title: "Category in Use",
        description: `Cannot delete "${categoryToDelete.name}". ${roomsInUse.length} room(s) are still assigned to this category. Please re-assign them first.`,
      });
      return;
    }

    const categoryRef = doc(firestore, 'hotels', hotelId, 'roomCategories', categoryId);
    deleteDocumentNonBlocking(categoryRef);
    
    toast({
        title: "Category Deleted",
        description: `The category "${categoryToDelete?.name}" has been removed.`,
        variant: "destructive"
    });
  }, [firestore, hotelId, rooms, roomCategories, toast]);


  const stateValue: RoomStateContextType = useMemo(() => ({
    rooms,
    checkoutHistory,
    roomCategories,
    todaysArrivals,
    todaysDepartures,
    isManageRoomOpen,
    selectedRoom,
    selectedStayId,
    selectedDate,
    dialogAction
  }), [rooms, checkoutHistory, roomCategories, todaysArrivals, todaysDepartures, isManageRoomOpen, selectedRoom, selectedStayId, selectedDate, dialogAction]);

  const actionsValue: RoomActionsContextType = useMemo(() => ({
    updateRoom,
    addRooms,
    deleteRoom,
    addStay,
    addGroupBooking,
    updateStay,
    removeStay,
    checkInStay,
    archiveStay,
    addCategory,
    updateCategory,
    deleteCategory,
    openManageRoom,
    closeManageRoom
  }), [updateRoom, addRooms, deleteRoom, addStay, addGroupBooking, updateStay, removeStay, checkInStay, archiveStay, addCategory, updateCategory, deleteCategory, openManageRoom, closeManageRoom]);

  return (
    <RoomStateContext.Provider value={stateValue}>
      <RoomActionsContext.Provider value={actionsValue}>
        {children}
      </RoomActionsContext.Provider>
    </RoomStateContext.Provider>
  );
});

RoomProviderInternal.displayName = 'RoomProviderInternal';

export function RoomProvider({ children }: { children: ReactNode }) {
  return <RoomProviderInternal>{children}</RoomProviderInternal>;
}

export function useRoomState() {
  const context = useContext(RoomStateContext);
  if (context === undefined) {
    throw new Error('useRoomState must be used within a RoomProvider');
  }
  return context;
}

export function useRoomActions() {
    const context = useContext(RoomActionsContext);
    if (context === undefined) {
        throw new Error('useRoomActions must be used within a RoomProvider');
    }
    return context;
}

// Deprecated: use useRoomState or useRoomActions instead
export function useRooms() {
  const stateContext = useContext(RoomStateContext);
  const actionsContext = useContext(RoomActionsContext);
  if (stateContext === undefined || actionsContext === undefined) {
    throw new Error('useRooms must be used within a RoomProvider');
  }
  return { ...stateContext, ...actionsContext };
}
