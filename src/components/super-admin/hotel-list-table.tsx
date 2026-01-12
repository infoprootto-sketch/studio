
'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, ToggleLeft, ToggleRight, Loader2, Users, AlertCircle, BedDouble } from "lucide-react"
import type { Hotel } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { EditHotelDialog } from './edit-hotel-dialog';
import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface HotelListTableProps {
  hotels: Hotel[];
  isLoading: boolean;
}

export function HotelListTable({ hotels, isLoading }: HotelListTableProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleStatusToggle = (hotel: Hotel) => {
    if (!firestore) return;
    const newStatus = hotel.status === 'Active' ? 'Disabled' : 'Active';
    const hotelRef = doc(firestore, 'hotels', hotel.id);
    updateDocumentNonBlocking(hotelRef, { status: newStatus });
    
    if (newStatus === 'Disabled') {
        toast({
            title: `Hotel Disabled`,
            description: `Logins for all users associated with "${hotel.name}" will now be blocked.`,
            variant: "destructive"
        });
    } else {
        toast({
            title: `Hotel Enabled`,
            description: `Users associated with "${hotel.name}" can now log in.`,
        });
    }
  };

  const handleOpenEditDialog = (hotel: Hotel) => {
    setSelectedHotel(hotel);
    setIsEditDialogOpen(true);
  };

  const handleSave = (hotelId: string, updates: Partial<Hotel>) => {
    if (!firestore) return;
    const hotelRef = doc(firestore, 'hotels', hotelId);
    updateDocumentNonBlocking(hotelRef, updates);
    toast({
        title: "Hotel Updated",
        description: "The hotel details have been successfully updated."
    });
    setIsEditDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        <p>Loading hotel data...</p>
      </div>
    );
  }

  if (hotels.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No hotels have been registered on the platform yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg">
        <TooltipProvider>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hotel Name</TableHead>
              <TableHead>Team Size</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Rooms</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {hotels.map((hotel) => {
              const isOverLimit = (hotel.roomCount || 0) > hotel.roomLimit;
              return (
              <TableRow key={hotel.id}>
                <TableCell className="font-medium">
                    <Link href={`/super-admin/hotels/${hotel.id}`} className="hover:underline">
                        {hotel.name}
                    </Link>
                </TableCell>
                <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 cursor-pointer">
                            <Users className="size-4 text-muted-foreground" />
                            <span>{hotel.teamSize || 0}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs space-y-1">
                          <p>Admins: {hotel.adminCount || 0}</p>
                          <p>Managers: {hotel.managerCount || 0}</p>
                          <p>Reception: {hotel.receptionCount || 0}</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{hotel.plan || 'Boutique'}</Badge>
                </TableCell>
                <TableCell className={cn(isOverLimit && 'text-red-500 font-bold')}>
                   <div className="flex items-center gap-1">
                     <BedDouble className="size-4 text-muted-foreground" />
                     <span>{hotel.roomCount || 0} / {hotel.roomLimit || 50}</span>
                     {isOverLimit && (
                        <Tooltip>
                            <TooltipTrigger>
                                <AlertCircle className="size-4 text-red-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>This hotel has exceeded its room limit.</p>
                            </TooltipContent>
                        </Tooltip>
                     )}
                   </div>
                </TableCell>
                <TableCell>
                  <Badge className={cn(
                      hotel.status === 'Active' ? 'bg-green-500' : 'bg-red-500',
                      "hover:bg-opacity-80"
                  )}>
                    {hotel.status || 'Active'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" className="mr-2" onClick={() => handleOpenEditDialog(hotel)}>
                    <Edit className="mr-2 h-4 w-4"/> Edit
                  </Button>
                  <Button 
                      variant={hotel.status === 'Active' ? "destructive" : "default"} 
                      size="sm" 
                      onClick={() => handleStatusToggle(hotel)}
                  >
                      {hotel.status === 'Active' ? 
                          <ToggleLeft className="mr-2 h-4 w-4" /> : 
                          <ToggleRight className="mr-2 h-4 w-4" />
                      }
                      {hotel.status === 'Active' ? 'Disable' : 'Enable'}
                  </Button>
                </TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
        </TooltipProvider>
      </div>
      <EditHotelDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        hotel={selectedHotel}
        onSave={handleSave}
      />
    </>
  )
}
