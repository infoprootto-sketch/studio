
'use client';

import { useFirestore, useDoc, useCollection, useMemoFirebase, FirestorePermissionError, errorEmitter } from "@/firebase";
import { useParams } from "next/navigation";
import { collection, doc, updateDoc } from "firebase/firestore";
import type { Hotel, TeamMember, Shift, Restaurant, Room, Department } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { TeamManagementTable } from "@/components/dashboard/team-management-table";
import { PageLoader } from "@/components/common/page-loader";
import { Badge } from "@/components/ui/badge";
import React, { useEffect } from "react";
import { RoomManagementTable } from "@/components/dashboard/room-management-table";
import { SettingsProvider } from "@/context/settings-context";

function HotelDetailPageDataHandler() {
    const params = useParams();
    const hotelId = params.hotelId as string;
    const firestore = useFirestore();

    const hotelDocRef = useMemoFirebase(
        () => (firestore && hotelId ? doc(firestore, 'hotels', hotelId) : null),
        [firestore, hotelId]
    );
    const { data: hotel, isLoading: isLoadingHotel } = useDoc<Hotel>(hotelDocRef);

    const teamMembersCollectionRef = useMemoFirebase(() => (firestore && hotelId ? collection(firestore, 'hotels', hotelId, 'teamMembers') : null), [firestore, hotelId]);
    const roomsCollectionRef = useMemoFirebase(() => (firestore && hotelId ? collection(firestore, 'hotels', hotelId, 'rooms') : null), [firestore, hotelId]);
    const shiftsCollectionRef = useMemoFirebase(() => (firestore && hotelId ? collection(firestore, 'hotels', hotelId, 'shifts') : null), [firestore, hotelId]);
    const departmentsCollectionRef = useMemoFirebase(() => (firestore && hotelId ? collection(firestore, 'hotels', hotelId, 'departments') : null), [firestore, hotelId]);
    const restaurantsCollectionRef = useMemoFirebase(() => (firestore && hotelId ? collection(firestore, 'hotels', hotelId, 'restaurants') : null), [firestore, hotelId]);

    const { data: teamMembers, isLoading: isLoadingTeam } = useCollection<TeamMember>(teamMembersCollectionRef);
    const { data: rooms, isLoading: isLoadingRooms } = useCollection<Room>(roomsCollectionRef);
    const { data: shifts = [] } = useCollection<Shift>(shiftsCollectionRef);
    const { data: departments = [] } = useCollection<Department>(departmentsCollectionRef);
    const { data: restaurants = [] } = useCollection<Restaurant>(restaurantsCollectionRef);


    useEffect(() => {
        if (hotel && teamMembers && hotelDocRef) {
            const updates: Partial<Hotel> = {};
            const actualTeamSize = teamMembers.length;
            const actualAdminCount = teamMembers.filter(m => m.role === 'Admin').length;
            const actualManagerCount = teamMembers.filter(m => m.role === 'Manager').length;
            const actualReceptionCount = teamMembers.filter(m => m.role === 'Reception').length;

            if (hotel.teamSize !== actualTeamSize) updates.teamSize = actualTeamSize;
            if (hotel.adminCount !== actualAdminCount) updates.adminCount = actualAdminCount;
            if (hotel.managerCount !== actualManagerCount) updates.managerCount = actualManagerCount;
            if (hotel.receptionCount !== actualReceptionCount) updates.receptionCount = actualReceptionCount;
            
            if (Object.keys(updates).length > 0) {
                updateDoc(hotelDocRef, updates).catch(async (serverError) => {
                    const permissionError = new FirestorePermissionError({
                      path: hotelDocRef.path,
                      operation: 'update',
                      requestResourceData: updates,
                    });
                    errorEmitter.emit('permission-error', permissionError);
                });
            }
        }
    }, [hotel, teamMembers, hotelDocRef]);
    
    useEffect(() => {
        if (hotel && rooms && hotelDocRef) {
             const actualRoomCount = rooms.length;
             if (hotel.roomCount !== actualRoomCount) {
                const updates = { roomCount: actualRoomCount };
                updateDoc(hotelDocRef, updates).catch(async (serverError) => {
                    const permissionError = new FirestorePermissionError({
                      path: hotelDocRef.path,
                      operation: 'update',
                      requestResourceData: updates,
                    });
                    errorEmitter.emit('permission-error', permissionError);
                });
             }
        }
    }, [hotel, rooms, hotelDocRef]);

    if (isLoadingHotel || isLoadingTeam || isLoadingRooms) {
        return <PageLoader />;
    }

    if (!hotel) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Hotel Not Found</CardTitle>
                    <CardDescription>The requested hotel could not be found.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight font-headline">{hotel.name}</h1>
                <p className="text-muted-foreground">{hotel.location}</p>
                <div className="flex gap-2 mt-2">
                    <Badge variant="outline">{hotel.plan || 'Boutique'}</Badge>
                    <Badge variant="secondary">{hotel.roomLimit || 0} Rooms</Badge>
                </div>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>List of all staff members registered for this hotel.</CardDescription>
                </CardHeader>
                <CardContent>
                    <TeamManagementTable
                        teamMembers={teamMembers || []}
                        departments={departments}
                        shifts={shifts}
                        restaurants={restaurants}
                        onSave={() => {}}
                        onDelete={() => {}}
                        role="admin" 
                    />
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Rooms</CardTitle>
                    <CardDescription>List of all rooms for this hotel.</CardDescription>
                </CardHeader>
                <CardContent>
                    <RoomManagementTable roomsProp={rooms} isSuperAdminView={true} />
                </CardContent>
            </Card>
        </div>
    );
}

export default function SuperAdminHotelDetailPage() {
    return (
        <SettingsProvider>
            <HotelDetailPageDataHandler />
        </SettingsProvider>
    )
}
