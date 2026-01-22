
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Room, RoomCategory } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRoomState } from '@/context/room-context';

interface EditRoomDialogProps {
  room: Partial<Room> | null;
  roomCategories: RoomCategory[];
  onClose: () => void;
  onSave: (room: Partial<Room> | Partial<Room>[]) => void;
}

export function EditRoomDialog({ room, roomCategories, onClose, onSave }: EditRoomDialogProps) {
  const [number, setNumber] = useState('');
  const [type, setType] = useState('');
  const [isBulkAdd, setIsBulkAdd] = useState(false);
  const [startNumber, setStartNumber] = useState('');
  const [endNumber, setEndNumber] = useState('');

  const { toast } = useToast();
  const { rooms } = useRoomState();

  const isEditing = room && room.id;

  useEffect(() => {
    if (room) {
      setNumber(room.number || '');
      setType(room.type || (roomCategories.length > 0 ? roomCategories[0].name : ''));
      setIsBulkAdd(false);
    } else {
      // Reset for "Add New"
      setNumber('');
      setType(roomCategories.length > 0 ? roomCategories[0].name : '');
      setIsBulkAdd(false);
      setStartNumber('');
      setEndNumber('');
    }
  }, [room, roomCategories]);

  const handleSave = () => {
    if (isEditing) { // Handle editing a single room
      if (!number || !type) {
        toast({
          variant: "destructive",
          title: "Missing Information",
          description: "Please fill out all fields.",
        });
        return;
      }
      
      const isDuplicate = rooms.some(r => r.number === number && r.id !== room.id);
      if (isDuplicate) {
          toast({
              variant: "destructive",
              title: "Duplicate Room Number",
              description: `A room with the number "${number}" already exists.`,
          });
          return;
      }

      onSave({ ...room, number, type });
      toast({
        title: "Room Updated",
        description: `Room ${number} has been successfully updated.`,
      });
    } else { // Handle adding new room(s)
      if (isBulkAdd) {
        const start = parseInt(startNumber);
        const end = parseInt(endNumber);

        if (!startNumber || !endNumber || isNaN(start) || isNaN(end) || start > end || !type) {
          toast({
            variant: "destructive",
            title: "Invalid Input",
            description: "Please enter a valid start/end number range and select a room type.",
          });
          return;
        }

        const newRooms: Partial<Room>[] = [];
        for (let i = start; i <= end; i++) {
            const roomNumberStr = i.toString();
            const isDuplicate = rooms.some(r => r.number === roomNumberStr);
            if (isDuplicate) {
                toast({
                    variant: "destructive",
                    title: `Duplicate Room Number`,
                    description: `A room with the number "${roomNumberStr}" already exists. Bulk add aborted.`,
                });
                return;
            }
          newRooms.push({ number: roomNumberStr, type });
        }
        onSave(newRooms);
        toast({
          title: "Rooms Added",
          description: `${newRooms.length} rooms have been successfully added.`,
        });

      } else { // Handle adding a single room
        if (!number || !type) {
          toast({
            variant: "destructive",
            title: "Missing Information",
            description: "Please fill out all fields.",
          });
          return;
        }
        const isDuplicate = rooms.some(r => r.number === number);
        if (isDuplicate) {
            toast({
                variant: "destructive",
                title: "Duplicate Room Number",
                description: `A room with the number "${number}" already exists.`,
            });
            return;
        }

        onSave({ number, type });
        toast({
          title: "Room Added",
          description: `Room ${number} has been successfully added.`,
        });
      }
    }
    onClose();
  };

  return (
    <div className="py-4 space-y-4">
        {!isEditing && (
            <div className="flex items-center space-x-2">
            <Checkbox id="bulk-add" checked={isBulkAdd} onCheckedChange={(checked) => setIsBulkAdd(!!checked)} />
            <Label htmlFor="bulk-add">Add multiple rooms</Label>
        </div>
        )}

        {isBulkAdd && !isEditing ? (
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="start-number">Start Number</Label>
                <Input id="start-number" value={startNumber} onChange={(e) => setStartNumber(e.target.value)} placeholder="e.g., 101" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="end-number">End Number</Label>
                <Input id="end-number" value={endNumber} onChange={(e) => setEndNumber(e.target.value)} placeholder="e.g., 110" />
            </div>
        </div>
        ) : (
        <div className="space-y-2">
            <Label htmlFor="room-number">Room Number</Label>
            <Input id="room-number" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="e.g., 101" />
        </div>
        )}

        <div className="space-y-2">
        <Label htmlFor="room-type">Room Type</Label>
        <Select value={type} onValueChange={setType}>
            <SelectTrigger id="room-type">
                <SelectValue placeholder="Select a room type" />
            </SelectTrigger>
            <SelectContent>
                {roomCategories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>
                ))}
            </SelectContent>
        </Select>
        </div>

        <div className="pt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
                Cancel
            </Button>
            <Button onClick={handleSave}>
                {isEditing ? 'Save Changes' : 'Add Room(s)'}
            </Button>
        </div>
    </div>
  );
}
