

'use client';

import { useState, useMemo, useEffect } from 'react';
import { RoomAvailabilityGrid } from "@/components/dashboard/room-availability-grid";
import { ManageStaySheet } from "@/components/dashboard/manage-stay-sheet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRoomState, useRoomActions } from "@/context/room-context";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useHotelId } from '@/context/hotel-id-context';
import Link from 'next/link';
import { OccupancyCheck } from '@/components/dashboard/occupancy-check';


export default function ReservationsPage() {
    const {
        isManageRoomOpen,
        selectedRoom,
        selectedStayId,
        selectedDate: initialDate,
        dialogAction,
        rooms,
    } = useRoomState();
    const { closeManageRoom } = useRoomActions();


    const hotelId = useHotelId();

    return (
        <>
            <div className="space-y-6">
                 <OccupancyCheck />
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Reservations & Availability</CardTitle>
                            <CardDescription>
                                View room availability and manage existing reservations from the calendar.
                            </CardDescription>
                        </div>
                        <Button asChild className="transition-transform active:scale-95">
                            <Link href={`/${hotelId}/dashboard/reservations/create-booking`}>
                                <PlusCircle className="mr-2" />
                                Create New Booking
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <RoomAvailabilityGrid />
                    </CardContent>
                </Card>
            </div>

            <ManageStaySheet
                key={selectedStayId || selectedRoom?.id}
                isOpen={isManageRoomOpen}
                onClose={closeManageRoom}
                room={selectedRoom}
                rooms={rooms}
                stayId={selectedStayId}
                initialDate={initialDate}
                action={dialogAction}
            />
        </>
    )
}
