
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Room, RoomCategory, RoomStatus, Hotel } from '@/lib/types';
import { EditRoomDialog } from './edit-room-dialog';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Download, ChevronDown, Search, Edit, Trash2, AlertCircle } from 'lucide-react';
import { QrCodeCell } from './qr-code-cell';
import JSZip from 'jszip';
import { QRCodeCanvas } from 'qrcode.react';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { createRoot } from 'react-dom/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { useRoomActions, useRoomState } from '@/context/room-context';
import { useHotelId } from '@/context/hotel-id-context';
import { useSettings } from '@/context/settings-context';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '../ui/tooltip';

const allStatuses: RoomStatus[] = ['Available', 'Occupied', 'Cleaning', 'Out of Order', 'Waiting for Check-in', 'Reserved'];

interface RoomManagementTableProps {
  roomsProp?: Room[];
  isSuperAdminView?: boolean;
}

export function RoomManagementTable({ roomsProp, isSuperAdminView = false }: RoomManagementTableProps) {
  const roomState = useRoomState();
  const roomActions = useRoomActions();
  
  const rooms = roomsProp || roomState.rooms;
  const roomCategories = roomState.roomCategories;

  const [selectedRoom, setSelectedRoom] = useState<Partial<Room> | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(''); // Default to empty string
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  
  const { toast } = useToast();
  const hotelId = useHotelId();
  const { legalName } = useSettings();
  const firestore = useFirestore();

  const hotelDocRef = useMemo(() => (firestore && hotelId ? doc(firestore, 'hotels', hotelId) : null), [firestore, hotelId]);
  const { data: hotelData } = useDoc<Hotel>(hotelDocRef);

  const isAnyFilterActive = useMemo(() => {
    return searchQuery !== '' || categoryFilter !== '' || statusFilter !== 'All';
  }, [searchQuery, categoryFilter, statusFilter]);


  const isAtRoomLimit = useMemo(() => {
    if (isSuperAdminView || !hotelData || !hotelData.roomLimit) return false;
    return rooms.length >= hotelData.roomLimit;
  }, [rooms, hotelData, isSuperAdminView]);

  const filteredRooms = useMemo(() => {
    if (!isAnyFilterActive) {
      return [];
    }
    return (rooms || []).filter(room => {
        const searchMatch = !searchQuery || room.number.toLowerCase().includes(searchQuery.toLowerCase());
        const categoryMatch = categoryFilter === 'All' || categoryFilter === '' || room.type === categoryFilter;
        const statusMatch = statusFilter === 'All' || (room.displayStatus || room.status) === statusFilter;
        return searchMatch && categoryMatch && statusMatch;
    });
  }, [rooms, searchQuery, categoryFilter, statusFilter, isAnyFilterActive]);

  useEffect(() => {
    setSelectedRoomIds([]);
  }, [searchQuery, categoryFilter, statusFilter]);

  const handleOpenSheet = (room?: Partial<Room>) => {
    if (isSuperAdminView) return;
    setSelectedRoom(room || null);
    setIsSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setIsSheetOpen(false);
    setSelectedRoom(null);
  };

  const handleSaveRoom = (roomData: Partial<Room> | Partial<Room>[]) => {
     if (Array.isArray(roomData)) {
      if (isAtRoomLimit && rooms.length + roomData.length > (hotelData?.roomLimit || Infinity)) {
        toast({
          variant: "destructive",
          title: "Room Limit Exceeded",
          description: `You can only add ${ (hotelData?.roomLimit || 0) - rooms.length} more rooms.`,
        });
        return;
      }
      roomActions.addRooms(roomData);
    } else if (roomData.id) {
      roomActions.updateRoom(roomData.id, roomData);
    } else {
       if (isAtRoomLimit) {
        toast({
          variant: "destructive",
          title: "Room Limit Reached",
          description: "Please upgrade your plan to add more rooms.",
        });
        return;
      }
       roomActions.addRooms([roomData]);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    await roomActions.deleteRoom(roomId);
  };

  const handleBulkDelete = () => {
    const deletableRooms = selectedRoomIds.map(id => rooms.find(r => r.id === id)).filter(Boolean) as Room[];
    
    deletableRooms.forEach(room => {
        // The deleteRoom function now handles the check for occupied rooms
        roomActions.deleteRoom(room.id);
    });
    
    setSelectedRoomIds([]);
  };

  const getGuestPortalUrl = () => {
    if (typeof window !== 'undefined' && hotelId) {
      return `${window.location.origin}/guest/login/${hotelId}`;
    }
    return '';
  };

  const createStyledQrCanvas = async (room: Room, url: string): Promise<HTMLCanvasElement | null> => {
    const mainCanvas = document.createElement('canvas');
    mainCanvas.width = 400;
    mainCanvas.height = 500;
    const ctx = mainCanvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, mainCanvas.width, mainCanvas.height);

    ctx.fillStyle = '#111827';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(legalName, mainCanvas.width / 2, 50);
    
    ctx.fillStyle = '#374151';
    ctx.font = '16px sans-serif';
    ctx.fillText('Welcome', mainCanvas.width / 2, 80);

    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    document.body.appendChild(tempDiv);
    
    const root = createRoot(tempDiv);
    
    await new Promise<void>(resolve => {
        root.render(
            <QRCodeCanvas value={url} size={200} bgColor={"#ffffff"} fgColor={"#000000"} level={"H"} />
        );
        setTimeout(resolve, 50);
    });

    const qrCanvasForDrawing = tempDiv.querySelector('canvas');
    if (!qrCanvasForDrawing) {
      root.unmount();
      document.body.removeChild(tempDiv);
      return null;
    }

    ctx.drawImage(qrCanvasForDrawing, (mainCanvas.width - 200) / 2, 110, 200, 200);

    ctx.fillStyle = '#111827';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('Scan for Guest Services', mainCanvas.width / 2, 360);
    
    ctx.fillStyle = '#6B7280';
    ctx.font = '14px sans-serif';
    ctx.fillText('Order food, request amenities, and more.', mainCanvas.width / 2, 390);

    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#9CA3AF';
    ctx.fillText('Powered by StayCentral', mainCanvas.width / 2, 475);
    
    ctx.fillStyle = '#E5E7EB';
    ctx.fillRect(50, 420, mainCanvas.width - 100, 1);
    
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(`Room ${room.number}`, mainCanvas.width / 2, 450);

    root.unmount();
    document.body.removeChild(tempDiv);
    
    return mainCanvas;
  };


  const handleDownloadAllQRs = async () => {
    const zip = new JSZip();
    const url = getGuestPortalUrl();
    if (!url) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not generate guest portal URL.' });
      return;
    }
    
    for (const room of rooms) {
        const styledCanvas = await createStyledQrCanvas(room, url);
        if (styledCanvas) {
            const pngDataUrl = styledCanvas.toDataURL('image/png');
            const pngData = pngDataUrl.split(';base64,')[1];
            zip.file(`qr-room-${room.number}.png`, pngData, { base64: true });
        }
    }
    
    zip.generateAsync({ type: 'blob' }).then((content) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = 'staycentral-qrcodes.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    toast({
        title: "Downloading All QR Codes",
        description: "A zip file with all room QR codes is being generated.",
    });
  };


  const handleDownloadRoomList = () => {
    const headers = ['Room Number', 'Type', 'Status'];
    const csvRows = [
      headers.join(','),
      ...rooms.map(room => [room.number, room.type, room.status].join(','))
    ];
    
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'staycentral-room-list.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

     toast({
        title: "Downloading Room List",
        description: "A CSV file with all rooms is being downloaded.",
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRoomIds(filteredRooms.map(room => room.id));
    } else {
      setSelectedRoomIds([]);
    }
  };

  const handleRowSelect = (roomId: string, checked: boolean) => {
    if (checked) {
      setSelectedRoomIds(prev => [...prev, roomId]);
    } else {
      setSelectedRoomIds(prev => prev.filter(id => id !== roomId));
    }
  };


  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2 mb-4">
        <div className="flex flex-col sm:flex-row gap-2 w-full">
            <div className="relative w-full sm:w-48">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search room..."
                    className="pl-8 w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[240px]">
                    <SelectValue placeholder="Select a category to view rooms..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="All">All Categories</SelectItem>
                    {roomCategories.map(cat => (
                        <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
             <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by status..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="All">All Statuses</SelectItem>
                    {allStatuses.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        {!isSuperAdminView && (
          <div className="flex w-full sm:w-auto gap-2">
              {selectedRoomIds.length > 0 ? (
                  <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full sm:w-auto">
                          <Trash2 className="mr-2 h-4 w-4"/> Delete ({selectedRoomIds.length})
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete {selectedRoomIds.length} room(s). Occupied rooms will be skipped.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setSelectedRoomIds([])}>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleBulkDelete}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
              ) : (
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full sm:w-auto">
                              <Download className="mr-2 h-4 w-4" />
                              Download
                              <ChevronDown className="ml-2 h-4 w-4" />
                          </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                          <DropdownMenuItem onClick={handleDownloadAllQRs}>
                              All QR Codes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleDownloadRoomList}>
                              Room List (CSV)
                          </DropdownMenuItem>
                      </DropdownMenuContent>
                  </DropdownMenu>
              )}

              <TooltipProvider>
                  <Tooltip>
                      <TooltipTrigger asChild>
                          <div className="w-full sm:w-auto">
                              <Button onClick={() => handleOpenSheet()} className="w-full" id="add-room-btn" disabled={isAtRoomLimit}>
                                  <PlusCircle className="mr-2 h-4 w-4" />
                                  Add New Room(s)
                              </Button>
                          </div>
                      </TooltipTrigger>
                      {isAtRoomLimit && (
                          <TooltipContent>
                              <p>You have reached your plan's room limit ({hotelData?.roomLimit}).</p>
                          </TooltipContent>
                      )}
                  </Tooltip>
              </TooltipProvider>

          </div>
        )}
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {!isSuperAdminView && <TableHead className="w-[50px]">
                 <Checkbox
                    checked={filteredRooms.length > 0 && selectedRoomIds.length === filteredRooms.length}
                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                    aria-label="Select all"
                />
              </TableHead>}
              <TableHead>Room Number</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              {!isSuperAdminView && <TableHead>QR Code</TableHead>}
              {!isSuperAdminView && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isAnyFilterActive ? (
                filteredRooms.length > 0 ? filteredRooms.map((room) => (
                  <TableRow key={room.id} data-state={selectedRoomIds.includes(room.id) && "selected"}>
                    {!isSuperAdminView && <TableCell>
                        <Checkbox
                            checked={selectedRoomIds.includes(room.id)}
                            onCheckedChange={(checked) => handleRowSelect(room.id, !!checked)}
                            aria-label="Select row"
                        />
                    </TableCell>}
                    <TableCell className="font-medium">{room.number}</TableCell>
                    <TableCell>{room.type}</TableCell>
                    <TableCell>{room.displayStatus || room.status}</TableCell>
                    {!isSuperAdminView && <TableCell>
                      <QrCodeCell room={room} />
                    </TableCell>}
                    {!isSuperAdminView && <TableCell className="text-right">
                      <Button variant="outline" size="sm" className="mr-2" onClick={() => handleOpenSheet(room)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" disabled={room.status === 'Occupied'}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete Room {room.number}.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteRoom(room.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>}
                  </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={isSuperAdminView ? 4 : 6} className="h-24 text-center">
                            No rooms found for the selected filters.
                        </TableCell>
                    </TableRow>
                )
            ) : (
                 <TableRow>
                    <TableCell colSpan={isSuperAdminView ? 4 : 6} className="h-24 text-center">
                        Please select a filter to view rooms.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
            <SheetHeader>
                <SheetTitle>{selectedRoom?.id ? 'Edit Room' : 'Add New Room(s)'}</SheetTitle>
                <SheetDescription>
                    {selectedRoom?.id ? `Update the details for Room ${selectedRoom?.number}.` : 'Enter the details for the new room or range of rooms.'}
                </SheetDescription>
            </SheetHeader>
             <EditRoomDialog
                onSave={handleSaveRoom}
                room={selectedRoom}
                roomCategories={roomCategories}
                onClose={handleCloseSheet}
            />
        </SheetContent>
      </Sheet>
    </>
  );
}
