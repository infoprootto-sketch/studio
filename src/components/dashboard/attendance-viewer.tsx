'use client';

import React, { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { TeamMember, Shift, AttendanceRecord, TeamDepartment, AttendanceStatus } from '@/lib/types';
import { format, isValid } from 'date-fns';
import { AttendanceHistoryDialog } from './attendance-history-dialog';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useTeam } from '@/context/team-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';

interface AttendanceViewerProps {
  teamMembers: TeamMember[];
  shifts: Shift[];
}

const isRegistered = (id: string) => id.length > 20;

export function AttendanceViewer({ teamMembers, shifts }: AttendanceViewerProps) {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<TeamDepartment | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus>('Clocked In');

  const { departments } = useTeam();

  const handleViewHistory = (member: TeamMember) => {
    setSelectedMember(member);
    setIsHistoryOpen(true);
  };
  
  const handleCloseHistory = () => {
    setIsHistoryOpen(false);
    setSelectedMember(null);
  };

  const filteredTeamMembers = useMemo(() => {
    // Only show registered members in the attendance viewer
    const registeredMembers = teamMembers.filter(member => isRegistered(member.id));
    
    return registeredMembers.filter(member => {
        const searchMatch = !searchQuery || member.name.toLowerCase().includes(searchQuery.toLowerCase());
        const departmentMatch = departmentFilter === 'All' || member.department === departmentFilter;
        const statusMatch = statusFilter === 'All' || member.attendanceStatus === statusFilter;
        return searchMatch && departmentMatch && statusMatch;
    });

  }, [teamMembers, searchQuery, departmentFilter, statusFilter]);

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Search by team member name..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
        <Select value={departmentFilter} onValueChange={(v) => setDepartmentFilter(v as any)}>
            <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by Department..." />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="All">All Departments</SelectItem>
                {departments.map(dept => <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>)}
            </SelectContent>
        </Select>
        <div className="flex items-center gap-1 rounded-md border p-1 w-full sm:w-auto">
            <Button variant={statusFilter === 'All' ? 'secondary' : 'ghost'} size="sm" onClick={() => setStatusFilter('All')} className="flex-1 sm:flex-initial">All</Button>
            <Button variant={statusFilter === 'Clocked In' ? 'secondary' : 'ghost'} size="sm" onClick={() => setStatusFilter('Clocked In')} className="flex-1 sm:flex-initial">Clocked In</Button>
            <Button variant={statusFilter === 'Clocked Out' ? 'secondary' : 'ghost'} size="sm" onClick={() => setStatusFilter('Clocked Out')} className="flex-1 sm:flex-initial">Clocked Out</Button>
        </div>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
          <TableRow>
              <TableHead>Team Member</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Clock In</TableHead>
          </TableRow>
          </TableHeader>
          <TableBody>
          {filteredTeamMembers.length > 0 ? (
            filteredTeamMembers.map((member) => (
              <TableRow key={member.id} onClick={() => handleViewHistory(member)} className="cursor-pointer">
              <TableCell className="font-medium">{member.name}</TableCell>
              <TableCell>
                  <Badge variant="outline">{member.department}</Badge>
              </TableCell>
              <TableCell>
                  <Badge variant={member.attendanceStatus === 'Clocked In' ? 'default' : 'secondary'} className={member.attendanceStatus === 'Clocked In' ? 'bg-green-500' : ''}>{member.attendanceStatus}</Badge>
              </TableCell>
              <TableCell>
                  {member.lastClockIn && isValid(member.lastClockIn) ? format(member.lastClockIn, 'MMM d, h:mm a') : 'N/A'}
              </TableCell>
              </TableRow>
            ))
          ) : (
             <TableRow>
                <TableCell colSpan={4} className="text-center h-24">
                    No team members found for the selected filters.
                </TableCell>
             </TableRow>
          )}
          </TableBody>
        </Table>
      </div>
      <AttendanceHistoryDialog
        isOpen={isHistoryOpen}
        onClose={handleCloseHistory}
        member={selectedMember}
      />
    </>
  );
}
