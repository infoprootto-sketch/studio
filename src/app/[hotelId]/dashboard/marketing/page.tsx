
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useServices } from '@/context/service-context';
import type { Broadcast } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { BroadcastList } from '@/components/dashboard/broadcast-list';
import { EditBroadcastDialog } from '@/components/dashboard/edit-broadcast-dialog';
import { useRoomState } from '@/context/room-context';

export default function MarketingPage() {
    const { broadcasts, addBroadcast, updateBroadcast, deleteBroadcast } = useServices();
    const { roomCategories } = useRoomState();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedBroadcast, setSelectedBroadcast] = useState<Broadcast | null>(null);
    const { toast } = useToast();

    const handleOpenDialog = (broadcast?: Broadcast) => {
        setSelectedBroadcast(broadcast || null);
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setSelectedBroadcast(null);
    };

    const handleSaveBroadcast = (broadcastData: Partial<Broadcast>) => {
        if (broadcastData.id) {
            updateBroadcast(broadcastData.id, broadcastData);
            toast({ title: "Broadcast Updated", description: `"${broadcastData.title}" has been saved.` });
        } else {
            addBroadcast(broadcastData as Omit<Broadcast, 'id'>);
            toast({ title: "Broadcast Created", description: `"${broadcastData.title}" is now active.` });
        }
        handleCloseDialog();
    };

    const handleDeleteBroadcast = (broadcastId: string) => {
        deleteBroadcast(broadcastId);
        toast({
            title: "Broadcast Deleted",
            variant: "destructive",
        });
    };

    return (
        <>
            <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Broadcasts & Marketing</CardTitle>
                        <CardDescription>Create and manage announcements for your guests.</CardDescription>
                    </div>
                    <Button onClick={() => handleOpenDialog()}>
                        <PlusCircle className="mr-2" /> New Broadcast
                    </Button>
                </CardHeader>
                <CardContent>
                    <BroadcastList 
                        broadcasts={broadcasts}
                        onEdit={handleOpenDialog}
                        onDelete={handleDeleteBroadcast}
                    />
                </CardContent>
            </Card>
            </div>
            <EditBroadcastDialog
                isOpen={isDialogOpen}
                onClose={handleCloseDialog}
                onSave={handleSaveBroadcast}
                broadcast={selectedBroadcast}
                roomCategories={roomCategories.map(rc => rc.name)}
            />
        </>
    );
}
