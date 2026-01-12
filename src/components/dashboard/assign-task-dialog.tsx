
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ServiceRequest, TeamMember, Department } from '@/lib/types';
import { Badge } from '../ui/badge';

interface AssignTaskDialogProps {
  request: ServiceRequest | null;
  teamMembers: TeamMember[];
  departments: Department[];
  isOpen: boolean;
  onClose: () => void;
  onAssign: (requestId: string, memberId: string) => void;
}

export function AssignTaskDialog({ request, teamMembers, departments, isOpen, onClose, onAssign }: AssignTaskDialogProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string | undefined>();
  
  const relevantDepartment = useMemo(() => departments.find(d => d.name === request?.staff), [departments, request]);
  const relevantMembers = useMemo(() => teamMembers.filter(m => m.department === relevantDepartment?.name), [teamMembers, relevantDepartment]);
  const currentlyAssignedMember = useMemo(() => teamMembers.find(m => m.id === request?.assignedTo), [teamMembers, request]);

  const handleAssign = () => {
    if (request && selectedMemberId) {
      onAssign(request.id, selectedMemberId);
      onClose();
    }
  };
  
  useEffect(() => {
    if(!isOpen) {
      setSelectedMemberId(undefined);
    }
  }, [isOpen]);

  if (!request) return null;
  
  const isReassigning = !!request.assignedTo;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isReassigning ? 'Reassign Task' : 'Assign Task'}</DialogTitle>
          <DialogDescription asChild>
            <div>
              {isReassigning 
                ? <>This task is currently assigned to <Badge>{currentlyAssignedMember?.name || 'Unknown'}</Badge>. Select a new team member to reassign it.</>
                : `Assign "${request.service}" for Room ${request.roomNumber} to a team member from the ${request.staff} department.`
              }
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a team member..." />
            </SelectTrigger>
            <SelectContent>
              {relevantMembers.length > 0 ? relevantMembers.map(member => (
                <SelectItem key={member.id} value={member.id} disabled={member.id === request.assignedTo}>
                  {member.name} ({member.role})
                </SelectItem>
              )) : (
                <div className="p-4 text-sm text-muted-foreground">No members in this department.</div>
              )}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAssign} disabled={!selectedMemberId}>
            {isReassigning ? 'Reassign Task' : 'Assign Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    