'use client';

import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { Shift } from '@/lib/types';
import { EditShiftDialog } from './edit-shift-dialog';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

interface ShiftManagementProps {
  shifts: Shift[];
  onSave: (shift: Partial<Shift>) => void;
  onDelete: (shiftId: string) => void;
  role?: 'admin' | 'manager';
}

export function ShiftManagement({ shifts, onSave, onDelete, role = 'admin' }: ShiftManagementProps) {
  const [selectedShift, setSelectedShift] = useState<Partial<Shift> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleOpenDialog = (shift?: Shift) => {
    setSelectedShift(shift || null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedShift(null);
  };

  return (
    <>
      {role === 'admin' && (
        <div className="flex justify-end mb-4">
          <Button onClick={() => handleOpenDialog()}>
            <PlusCircle className="mr-2" />
            Add Shift
          </Button>
        </div>
      )}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Shift Name</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead>End Time</TableHead>
              {role === 'admin' && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {shifts.map((shift) => (
              <TableRow key={shift.id}>
                <TableCell className="font-medium">{shift.name}</TableCell>
                <TableCell>{shift.startTime}</TableCell>
                <TableCell>{shift.endTime}</TableCell>
                {role === 'admin' && (
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="mr-2" onClick={() => handleOpenDialog(shift)}>
                      <Edit className="mr-2" /> Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="mr-2" /> Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the "{shift.name}" shift. Any team members assigned to this shift will need to be manually reassigned. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDelete(shift.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <EditShiftDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onSave={onSave}
        shift={selectedShift}
      />
    </>
  );
}
