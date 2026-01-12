
'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Department } from '@/lib/types';
import { AlertCircle, Plus } from 'lucide-react';

interface ReassignDepartmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  departmentToDelete: Department | null;
  memberCount: number;
  allDepartments: Department[];
  onConfirm: (oldDeptName: string, newDeptName: string) => void;
}

const CREATE_NEW_VALUE = '__CREATE_NEW__';

export function ReassignDepartmentDialog({
  isOpen,
  onClose,
  departmentToDelete,
  memberCount,
  allDepartments,
  onConfirm,
}: ReassignDepartmentDialogProps) {
  const [targetDepartment, setTargetDepartment] = useState<string>('');
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const { toast } = useToast();

  const availableDepartments = allDepartments.filter(d => d.id !== departmentToDelete?.id) || [];

  useEffect(() => {
    if (isOpen) {
      setTargetDepartment(availableDepartments.length > 0 ? availableDepartments[0].name : CREATE_NEW_VALUE);
      setNewDepartmentName('');
    }
  }, [isOpen, allDepartments]);

  const handleConfirm = () => {
    if (!departmentToDelete) return;

    let finalTargetDept = targetDepartment;
    
    if (targetDepartment === CREATE_NEW_VALUE) {
        if (!newDepartmentName.trim()) {
            toast({
                variant: 'destructive',
                title: 'New Department Name Required',
            });
            return;
        }
        if (allDepartments.some(d => d.name.toLowerCase() === newDepartmentName.trim().toLowerCase())) {
            toast({
                variant: 'destructive',
                title: 'Department Already Exists',
            });
            return;
        }
        finalTargetDept = newDepartmentName.trim();
    }
    
    if (!finalTargetDept) {
      toast({
        variant: 'destructive',
        title: 'No Target Department',
        description: 'Please select or create a department to move members to.',
      });
      return;
    }

    onConfirm(departmentToDelete.name, finalTargetDept);
  };

  if (!isOpen || !departmentToDelete) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="text-yellow-500" /> Re-assign Team Members
          </DialogTitle>
          <DialogDescription>
            The department "{departmentToDelete.name}" has {memberCount} member(s). To delete it,
            please move them to another department.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="target-department">Move Members to Department</Label>
            <Select value={targetDepartment} onValueChange={setTargetDepartment}>
              <SelectTrigger id="target-department">
                <SelectValue placeholder="Select a department..." />
              </SelectTrigger>
              <SelectContent>
                {availableDepartments.map(dept => (
                  <SelectItem key={dept.id} value={dept.name}>
                    {dept.name}
                  </SelectItem>
                ))}
                <SelectItem value={CREATE_NEW_VALUE}>
                  <div className="flex items-center gap-2">
                    <Plus className="size-4" /> Create New Department...
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          {targetDepartment === CREATE_NEW_VALUE && (
            <div className="space-y-2 pl-2 border-l-2 border-primary ml-1">
              <Label htmlFor="new-dept-name">New Department Name</Label>
              <Input
                id="new-dept-name"
                value={newDepartmentName}
                onChange={e => setNewDepartmentName(e.target.value)}
                placeholder="e.g., Guest Services"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Move Members & Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
