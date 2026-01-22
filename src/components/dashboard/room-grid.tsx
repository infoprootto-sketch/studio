

'use client';

import React, { useState, useMemo } from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import type { Room, RoomStatus, Stay, RoomCategory, StockMovement } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Input } from '@/components/ui/input';
import { Search, CheckCircle, MoreVertical, XCircle } from 'lucide-react';
import { useRoomState, useRoomActions } from '@/context/room-context';
import { format, isWithinInterval, startOfDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SetOutOfOrderDialog } from './set-out-of-order-dialog';
import type { DateRange } from 'react-day-picker';
import { useToast } from '@/hooks/use-toast';
import { useInventory } from '@/context/inventory-context';
import { ManageStaySheet } from './manage-stay-sheet';


const statusColors: Record<RoomStatus, string> = {
    Available: "bg-green-500",
    Occupied: "bg-red-500",
    Cleaning: "bg-blue-500",
    'Out of Order': "bg-gray-500",
    'Waiting for Check-in': "bg-orange-500",
    Reserved: "bg-purple-500",
};

const roomStatuses: RoomStatus[] = [
    'Available',
    'Occupied',
    'Cleaning',
    'Waiting for Check-in',
    'Reserved',
    'Out of Order',
];

function getCurrentStay(room: Room): Stay | undefined {
    const today = startOfDay(new Date());
    return room.stays.find(stay => {
        const checkIn = startOfDay(new Date(stay.checkInDate));
        const checkOut = startOfDay(new Date(stay.checkOutDate));
        return today >= checkIn && today < checkOut;
    });
}

function RoomCard({ room, onStatusChange, onSetOutOfOrder }: { room: Room, onStatusChange: (room: Room, status: RoomStatus) => void; onSetOutOfOrder: (room: Room) => void; }) {
    const currentStay = getCurrentStay(room);

    return (
        <Card className="flex flex-col">
            <CardHeader className="flex flex-col items-start space-y-2 pb-2">
                <div className="flex justify-between items-center w-full">
                    <CardTitle className="text-base font-medium">Room {room.number}</CardTitle>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-6">
                                <MoreVertical className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onSetOutOfOrder(room)}>
                                <XCircle className="mr-2" />
                                Set Out of Order
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <Badge className={cn("w-32 flex justify-center", statusColors[room.displayStatus])}>
                    {room.displayStatus}
                </Badge>
            </CardHeader>
            <CardContent className="space-y-1 flex-grow">
                <p className="text-xs text-muted-foreground">{room.type}</p>
                {currentStay && <p className="font-semibold">{currentStay.guestName}</p>}
                {currentStay && (
                    <p className="text-xs text-muted-foreground">
                        {format(new Date(currentStay.checkInDate), "MMM d")} - {format(new Date(currentStay.checkOutDate), "MMM d")}
                    </p>
                )}
            </CardContent>
             {(room.displayStatus === 'Cleaning' || room.displayStatus === 'Out of Order') && (
                <CardFooter>
                    <Button variant="secondary" size="sm" className="w-full" onClick={() => onStatusChange(room, 'Available')}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark as Available
                    </Button>
                </CardFooter>
            )}
        </Card>
    )
}

export function RoomGrid({ initialRooms }: { initialRooms: Room[]}) {
  const { rooms: contextRooms, roomCategories } = useRoomState();
  const { 
    updateRoom,
    isManageRoomOpen, closeManageRoom, selectedRoom: managedRoom, selectedStayId, selectedDate, dialogAction
  } = useRoomActions();
  
  const rooms = initialRooms && initialRooms.length > 0 ? initialRooms : contextRooms;

  const { inventory, updateInventoryItem, addStockMovement } = useInventory();
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<RoomStatus>('Available');
  const [searchQuery, setSearchQuery] = useState('');
  const [isOutOfOrderDialogOpen, setIsOutOfOrderDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const { toast } = useToast();

  const roomsPerPage = 18;
  
  const handleFilterChange = (status: RoomStatus) => {
    setStatusFilter(status);
    setCurrentPage(1);
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  };
  
  const handleStatusChange = (room: Room, status: RoomStatus) => {
    const updates: Partial<Room> = { status };
  
    // Handle inventory deduction when cleaning is finished
    if (room.displayStatus === 'Cleaning' && status === 'Available') {
      const category = roomCategories.find(c => c.name === room.type);
      if (category && category.cleaningConsumables) {
        let totalDeductions = 0;
        
        category.cleaningConsumables.forEach(consumable => {
          const inventoryItem = inventory.find(i => i.id === consumable.itemId);
          if (inventoryItem) {
            totalDeductions++;
            updateInventoryItem(inventoryItem.id, { stock: inventoryItem.stock - consumable.quantity });
            addStockMovement({
              itemId: inventoryItem.id,
              itemName: inventoryItem.name,
              type: 'Consumption',
              quantity: -consumable.quantity,
              date: new Date(),
              notes: `Room ${room.number} cleaning`
            });
          }
        });
        
        if (totalDeductions > 0) {
          toast({
            title: "Inventory Updated",
            description: `${totalDeductions} item(s) deducted for cleaning Room ${room.number}.`,
          });
        }
      }
    }
  
    // Handle clearing 'Out of Order' blocks
    if (room.displayStatus === 'Out of Order' && status === 'Available') {
      const today = startOfDay(new Date());
      updates.outOfOrderBlocks = room.outOfOrderBlocks?.filter(block => !isWithinInterval(today, { start: startOfDay(block.from), end: startOfDay(block.to) }));
    }
  
    updateRoom(room.id, updates);
  };
  

  const handleOpenOutOfOrderDialog = (room: Room) => {
    setSelectedRoom(room);
    setIsOutOfOrderDialogOpen(true);
  };

  const handleConfirmOutOfOrder = (roomId: string, dateRange: DateRange) => {
    if (!dateRange.from || !dateRange.to) return;
    const roomToUpdate = rooms.find(r => r.id === roomId);
    if (roomToUpdate) {
      const newBlocks = [...(roomToUpdate.outOfOrderBlocks || []), { from: dateRange.from, to: dateRange.to }];
      updateRoom(roomId, { outOfOrderBlocks: newBlocks });
      toast({
        title: "Room Set to Out of Order",
        description: `Room ${roomToUpdate.number} is now marked as Out of Order for the selected dates.`
      });
    }
  };


  const filteredRooms = rooms
    .filter(room => statusFilter === 'All' || room.displayStatus === statusFilter)
    .filter(room => {
        const searchTerm = searchQuery.toLowerCase();
        if (searchTerm === '') return true;
        const roomNumberMatch = room.number.toLowerCase().includes(searchTerm);
        const currentStay = getCurrentStay(room);
        const guestNameMatch = currentStay?.guestName?.toLowerCase().includes(searchTerm);
        return roomNumberMatch || guestNameMatch;
    });

  const totalPages = Math.ceil(filteredRooms.length / roomsPerPage);
  const indexOfLastRoom = currentPage * roomsPerPage;
  const indexOfFirstRoom = indexOfLastRoom - indexOfLastRoom;
  const currentRooms = filteredRooms.slice(indexOfFirstRoom, indexOfLastRoom);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
    }
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="flex flex-wrap gap-2 flex-1">
            {roomStatuses.map((status) => (
                <button
                    key={status}
                    onClick={() => handleFilterChange(status)}
                    className={cn(
                        'px-3 py-1 text-sm rounded-full border',
                        statusFilter === status
                            ? 'bg-primary text-primary-foreground border-transparent'
                            : 'bg-transparent hover:bg-accent'
                    )}
                >
                    {status}
                </button>
            ))}
        </div>
        <div className="relative sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Search room or guest..."
                className="pl-8 w-full"
                value={searchQuery}
                onChange={handleSearchChange}
            />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {currentRooms.map((room) => (
          <RoomCard 
            key={room.id} 
            room={room} 
            onStatusChange={handleStatusChange}
            onSetOutOfOrder={handleOpenOutOfOrderDialog}
            />
        ))}
      </div>
       {totalPages > 1 && (
         <Pagination className="mt-8">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(currentPage - 1);
                  }}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    href="#"
                    isActive={currentPage === i + 1}
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(i + 1);
                    }}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(currentPage + 1);
                  }}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
       )}
       {currentRooms.length === 0 && (
            <div className="text-center py-12 text-muted-foreground col-span-full">
                No rooms match the current filters.
            </div>
        )}

      <SetOutOfOrderDialog
        isOpen={isOutOfOrderDialogOpen}
        onClose={() => setIsOutOfOrderDialogOpen(false)}
        room={selectedRoom}
        onConfirm={handleConfirmOutOfOrder}
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
