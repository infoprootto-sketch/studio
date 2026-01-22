

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import type { Room, ServiceRequest, HotelService, CorporateClient, BilledOrder, Stay, BilledOrderStatus, ServiceRequestStatus, Department } from '@/lib/types';
import { LiveActivityRoomCard } from './live-activity-room-card';
import { AddManualChargeDialog } from './add-manual-charge-dialog';
import { ServiceLogDialog } from './service-log-dialog';
import { GenerateBillSheet } from './generate-bill-sheet';
import { useToast } from '@/hooks/use-toast';
import { differenceInCalendarDays, differenceInMinutes, isToday, isSameDay, addDays, startOfDay } from 'date-fns';
import { useRoomState, useRoomActions } from '@/context/room-context';
import { useSettings } from '@/context/settings-context';
import { Input } from '@/components/ui/input';
import { Search, IndianRupee, LogOut, Calendar } from 'lucide-react';
import { ManageStaySheet } from './manage-stay-sheet';
import { useServices } from '@/context/service-context';
import { useBilling } from '@/context/billing-context';
import { useTeam } from '@/context/team-context';
import { useUser } from '@/firebase';
import { useInventory } from '@/context/inventory-context';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAdminBillingCalculator } from '@/hooks/use-admin-billing-calculator';
import { findDepartmentForCategory } from '@/lib/utils';


type CartItem = {
  service: HotelService;
  quantity: number;
};


export function LiveActivityGrid({ role = 'admin' }: { role?: 'admin' | 'manager' }) {
  const { rooms, isManageRoomOpen, selectedRoom: managedRoom, selectedStayId, selectedDate, dialogAction } = useRoomState();
  const { archiveStay, openManageRoom, closeManageRoom } = useRoomActions();
   const { hotelServices, serviceRequests, addServiceRequests, restaurants } = useServices();
   const { corporateClients, addBilledOrder } = useBilling();
   const { teamMembers, departments, slaRules } = useTeam();
   const { inventory, updateInventoryItem, addStockMovement } = useInventory();
   const { user } = useUser();
   const { getBillSummary } = useAdminBillingCalculator();

  const { gstRate, serviceChargeRate, formatPrice } = useSettings();
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedRoomForDialogs, setSelectedRoomForDialogs] = useState<Room | null>(null);
  const [isChargeDialogOpen, setIsChargeDialogOpen] = useState(false);
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [isBillSheetOpen, setIsBillSheetOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);
  
  const { toast } = useToast();

  const currentUser = useMemo(() => {
    if (!user || !teamMembers) return null;
    return teamMembers.find(member => member.id === user.uid);
  }, [user, teamMembers]);

  const {
    departingToday,
    departingTomorrow,
    departingLater,
    occupiedCount,
    filteredOccupiedCount
  } = useMemo(() => {
    if (!rooms) return { departingToday: [], departingTomorrow: [], departingLater: [], occupiedCount: 0, filteredOccupiedCount: 0 };
    
    let allOccupied = rooms.filter(room => room.displayStatus === 'Occupied' && room.stayId);
    const occupiedCount = allOccupied.length;
    
    let filteredOccupied = allOccupied;
    if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase();
        filteredOccupied = allOccupied.filter(room => {
            const stay = room.stays.find(s => s.stayId === room.stayId);
            return room.number.toLowerCase().includes(lowercasedQuery) || (stay && stay.guestName.toLowerCase().includes(lowercasedQuery));
        });
    }
    const filteredOccupiedCount = filteredOccupied.length;
    
    const today = startOfDay(new Date());
    const tomorrow = startOfDay(addDays(today, 1));
    
    const todayRooms: Room[] = [];
    const tomorrowRooms: Room[] = [];
    const laterRooms: Room[] = [];
    
    filteredOccupied.forEach(room => {
      const stay = room.stays.find(s => s.stayId === room.stayId);
      if (stay?.checkOutDate) {
        const checkOutDay = startOfDay(new Date(stay.checkOutDate));
        if (isSameDay(checkOutDay, today)) {
          todayRooms.push(room);
        } else if (isSameDay(checkOutDay, tomorrow)) {
          tomorrowRooms.push(room);
        } else {
          laterRooms.push(room);
        }
      } else {
        laterRooms.push(room);
      }
    });

    return {
      departingToday: todayRooms,
      departingTomorrow: tomorrowRooms,
      departingLater: laterRooms,
      occupiedCount,
      filteredOccupiedCount,
    };
  }, [rooms, searchQuery]);

  const hasSlaBreach = (roomNumber: string) => {
    if (!isClient || !serviceRequests || !slaRules) return false; // Prevent running on server or during hydration
    const roomRequests = serviceRequests.filter(req => req.roomNumber === roomNumber && (req.status === 'Pending' || req.status === 'In Progress'));
    return roomRequests.some(req => {
        const rule = slaRules.find(r => r.serviceName === req.category);
        if (!rule) return false;
        const timeElapsed = differenceInMinutes(currentTime, new Date(req.creationTime));
        return timeElapsed > rule.timeLimitMinutes;
    });
  }

  const handleOpenChargeDialog = (room: Room) => {
    setSelectedRoomForDialogs(room);
    setIsChargeDialogOpen(true);
  };
  
  const handleOpenLogDialog = (room: Room) => {
    setSelectedRoomForDialogs(room);
    setIsLogDialogOpen(true);
  };
  
  const handleOpenBillSheet = (room: Room) => {
    setSelectedRoomForDialogs(room);
    setIsBillSheetOpen(true);
  };

  const handleAddCharges = (items: CartItem[], status: ServiceRequestStatus) => {
    if (!selectedRoomForDialogs || !selectedRoomForDialogs.stayId || !departments || !user) return;

    const currentStayId = selectedRoomForDialogs.stayId;

    const newRequests: Omit<ServiceRequest, 'id'>[] = items.map(item => {
      const serviceDepartment = findDepartmentForCategory(departments, item.service.category, restaurants, item.service);
      return {
        stayId: currentStayId,
        roomNumber: selectedRoomForDialogs.number,
        service: `${item.service.name}`,
        quantity: item.quantity,
        serviceId: item.service.id,
        status: status,
        time: 'Just now',
        creationTime: new Date(),
        staff: serviceDepartment,
        isManualCharge: true,
        price: item.service.price * item.quantity,
        category: item.service.category,
        createdBy: user.uid,
      };
    });
    
    addServiceRequests(newRequests);

    // Handle inventory deduction
    newRequests.forEach(req => {
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
                notes: `Manual charge for Room ${req.roomNumber}`
              });
            }
          }
        }
      });


    toast({
      title: 'Manual Charges Added',
      description: `${items.length} item(s) were added to Room ${selectedRoomForDialogs.number}'s bill.`,
    });
    setIsChargeDialogOpen(false);
    setSelectedRoomForDialogs(null);
  };

  const handleMarkAsPaid = (roomId: string, stayId: string, amountPaid: number) => {
    const { updateStay } = useRoomActions();
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    const stay = room.stays.find(s => s.stayId === stayId);
    if (!stay) return;

    const newPaidAmount = (stay.paidAmount || 0) + amountPaid;
    updateStay(roomId, stayId, { paidAmount: newPaidAmount });
    
    toast({
        title: "Payment Recorded",
        description: `A payment has been successfully recorded for the room.`,
    })
    setIsBillSheetOpen(false);
    setSelectedRoomForDialogs(null);
  }

  const handleBillToCompany = (room: Room, stay: Stay, companyId: string, amount: number, status: BilledOrderStatus) => {
    if (!corporateClients) return;
    const { updateStay } = useRoomActions();
    const isPaid = status === 'Paid';
    
    const newBilledOrder: Omit<BilledOrder, 'id'> = {
        stayId: stay.stayId,
        guestName: stay.guestName,
        roomNumber: room.number,
        amount,
        status,
        date: new Date(),
        paidDate: isPaid ? new Date() : null,
    };

    addBilledOrder(companyId, newBilledOrder);
    
    // Clear the guest's balance by marking it as paid (since the company is now responsible)
    updateStay(room.id, stay.stayId, { 
        isBilledToCompany: true, 
        paidAmount: (stay.paidAmount || 0) + amount
    });

    const companyName = corporateClients.find(c => c.id === companyId)?.name || 'the company';
    toast({
      title: "Bill Assigned to Company",
      description: `The bill for ${stay.guestName} has been assigned to ${companyName} with status "${status}". The room balance is now clear.`,
    });
    
    // DO NOT CHECK OUT. This is now just a billing operation.
    // Checkout must be done manually via the "Final Checkout" button.
    setIsBillSheetOpen(false);
    setSelectedRoomForDialogs(null);
  };

  const stayServiceLogs = selectedRoomForDialogs?.stayId && serviceRequests
    ? serviceRequests.filter(req => req.stayId === selectedRoomForDialogs.stayId)
    : [];

   const { todaysDepartures, expectedRevenue } = useMemo(() => {
    if (!isClient) return { todaysDepartures: [], expectedRevenue: 0 };

    const departures = rooms.filter(room => 
      room.displayStatus === 'Occupied' && 
      room.stayId && 
      isToday(new Date(room.stays.find(s => s.stayId === room.stayId)?.checkOutDate || ''))
    );
    
    const revenue = departures.reduce((sum, room) => {
      const stay = room.stays.find(s => s.stayId === room.stayId);
      if (stay) {
        const { currentBalance } = getBillSummary(stay, room);
        return sum + currentBalance;
      }
      return sum;
    }, 0);
    
    return {
      todaysDepartures: departures,
      expectedRevenue: revenue,
    };
  }, [rooms, isClient, getBillSummary]);


  if (occupiedCount === 0 && todaysDepartures.length === 0) {
    return <p className="text-muted-foreground">There are no occupied rooms at the moment.</p>
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Departures</CardTitle>
                <LogOut className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{isClient ? todaysDepartures.length : '...'}</div>
                <p className="text-xs text-muted-foreground">Guests scheduled to check out today</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expected Revenue Today</CardTitle>
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{isClient ? formatPrice(expectedRevenue) : '...'}</div>
                <p className="text-xs text-muted-foreground">From today's scheduled departures</p>
            </CardContent>
        </Card>
      </div>

      <div className="mb-4 max-w-sm">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by room or guest name..."
            className="w-full rounded-lg bg-background pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {occupiedCount > 0 ? (
        <Accordion type="multiple" defaultValue={["departing-today"]} className="w-full space-y-4">
            {departingToday.length > 0 && (
                <AccordionItem value="departing-today" className="border rounded-lg bg-card">
                    <AccordionTrigger className="px-4 py-3 text-lg font-semibold hover:no-underline">
                        <div className="flex items-center gap-3">
                            <LogOut className="size-5 text-red-500" />
                            <span>Departing Today ({departingToday.length})</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 border-t">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {departingToday.map(room => {
                                const stay = room.stays.find(s => s.stayId === room.stayId);
                                const balance = stay ? getBillSummary(stay, room).currentBalance : 0;
                                return (
                                    <LiveActivityRoomCard
                                        key={room.id}
                                        room={room}
                                        role={role}
                                        balance={balance}
                                        hasSlaBreach={hasSlaBreach(room.number)}
                                        onAddCharge={() => handleOpenChargeDialog(room)}
                                        onViewLog={() => handleOpenLogDialog(room)}
                                        onGenerateBill={() => handleOpenBillSheet(room)}
                                        onManageStay={() => openManageRoom(room, room.stayId)}
                                    />
                                );
                            })}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            )}
             {departingTomorrow.length > 0 && (
                <AccordionItem value="departing-tomorrow" className="border rounded-lg bg-card">
                    <AccordionTrigger className="px-4 py-3 text-lg font-semibold hover:no-underline">
                        <div className="flex items-center gap-3">
                            <Calendar className="size-5 text-blue-500" />
                            <span>Departing Tomorrow ({departingTomorrow.length})</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 border-t">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {departingTomorrow.map(room => {
                                const stay = room.stays.find(s => s.stayId === room.stayId);
                                const balance = stay ? getBillSummary(stay, room).currentBalance : 0;
                                return (
                                    <LiveActivityRoomCard
                                        key={room.id}
                                        room={room}
                                        role={role}
                                        balance={balance}
                                        hasSlaBreach={hasSlaBreach(room.number)}
                                        onAddCharge={() => handleOpenChargeDialog(room)}
                                        onViewLog={() => handleOpenLogDialog(room)}
                                        onGenerateBill={() => handleOpenBillSheet(room)}
                                        onManageStay={() => openManageRoom(room, room.stayId)}
                                    />
                                );
                            })}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            )}
             {departingLater.length > 0 && (
                <AccordionItem value="departing-later" className="border rounded-lg bg-card">
                    <AccordionTrigger className="px-4 py-3 text-lg font-semibold hover:no-underline">
                         <div className="flex items-center gap-3">
                            <Calendar className="size-5 text-muted-foreground" />
                            <span>Departing Later ({departingLater.length})</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 border-t">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {departingLater.map(room => {
                                const stay = room.stays.find(s => s.stayId === room.stayId);
                                const balance = stay ? getBillSummary(stay, room).currentBalance : 0;
                                return (
                                    <LiveActivityRoomCard
                                        key={room.id}
                                        room={room}
                                        role={role}
                                        balance={balance}
                                        hasSlaBreach={hasSlaBreach(room.number)}
                                        onAddCharge={() => handleOpenChargeDialog(room)}
                                        onViewLog={() => handleOpenLogDialog(room)}
                                        onGenerateBill={() => handleOpenBillSheet(room)}
                                        onManageStay={() => openManageRoom(room, room.stayId)}
                                    />
                                );
                            })}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            )}
             {filteredOccupiedCount === 0 && searchQuery && (
                <div className="text-muted-foreground text-center col-span-full py-8">
                    <p>No occupied rooms found for "{searchQuery}".</p>
                </div>
            )}
        </Accordion>
      ) : (
        <p className="text-muted-foreground py-8">There are no occupied rooms at the moment.</p>
      )}


      <AddManualChargeDialog
        isOpen={isChargeDialogOpen}
        onClose={() => { setIsChargeDialogOpen(false); setSelectedRoomForDialogs(null); }}
        room={selectedRoomForDialogs}
        onAddCharges={handleAddCharges}
      />
      
      <ServiceLogDialog
        isOpen={isLogDialogOpen}
        onClose={() => { setIsLogDialogOpen(false); setSelectedRoomForDialogs(null); }}
        room={selectedRoomForDialogs}
        serviceLog={stayServiceLogs}
      />

      <GenerateBillSheet
        isOpen={isBillSheetOpen}
        onClose={() => { setIsBillSheetOpen(false); setSelectedRoomForDialogs(null); }}
        room={selectedRoomForDialogs}
        serviceLog={stayServiceLogs}
        onMarkAsPaid={handleMarkAsPaid}
        onBillToCompany={handleBillToCompany}
      />

      <ManageStaySheet
        key={selectedStayId || managedRoom?.id}
        isOpen={isManageRoomOpen}
        onClose={closeManageRoom}
        room={managedRoom}
        rooms={rooms}
        stayId={selectedStayId}
        initialDate={selectedDate}
        action={dialogAction}
      />
    </>
  );
}
