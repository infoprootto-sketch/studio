

'use client';

import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { TeamMember, Department, Shift, Restaurant } from '@/lib/types';
import { EditTeamMemberDialog } from './edit-team-member-dialog';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface TeamManagementTableProps {
  teamMembers: TeamMember[];
  departments: Department[];
  shifts: Shift[];
  restaurants: Restaurant[];
  onSave: (member: Partial<TeamMember>, password?: string) => void;
  onDelete: (memberId: string) => void;
  role?: 'admin' | 'manager';
}

const departmentColors: Record<string, string> = {
    'Reception': 'bg-blue-500',
    'F&B': 'bg-green-500',
    'Housekeeping': 'bg-orange-500',
    'Spa': 'bg-purple-500',
    'Gym': 'bg-pink-500',
    'Admin': 'bg-slate-500',
}

const roleColors = {
    'Owner': 'bg-yellow-500 text-black',
    'Admin': 'bg-red-500',
    'Manager': 'bg-primary',
    'Reception': 'bg-blue-500',
    'Member': 'bg-secondary text-secondary-foreground'
}

export function TeamManagementTable({ teamMembers, departments, shifts, restaurants, onSave, onDelete, role = 'admin' }: TeamManagementTableProps) {
  const [selectedMember, setSelectedMember] = useState<Partial<TeamMember> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [shiftFilter, setShiftFilter] = useState('All');

  const handleOpenDialog = (member?: TeamMember) => {
    if (role !== 'admin') return; // Prevent non-admins from opening the dialog
    setSelectedMember(member || null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedMember(null);
  };

  const departmentOptions = useMemo(() => {
    const allDepartments = new Set(departments.map(d => d.name));
    allDepartments.add('Administration');
    allDepartments.add('Front Office');
    return Array.from(allDepartments).sort();
  }, [departments]);


  const isAnyFilterActive = useMemo(() => {
    return searchQuery !== '' || departmentFilter !== 'All' || roleFilter !== 'All' || shiftFilter !== 'All';
  }, [searchQuery, departmentFilter, roleFilter, shiftFilter]);

  const filteredTeamMembers = useMemo(() => {
    if (!isAnyFilterActive) {
      return [];
    }

    return (teamMembers || []).filter(member => {
        const searchMatch = !searchQuery || member.name.toLowerCase().includes(searchQuery.toLowerCase()) || member.email.toLowerCase().includes(searchQuery.toLowerCase());
        const departmentMatch = departmentFilter === 'All' || member.department === departmentFilter;
        const roleMatch = roleFilter === 'All' || member.role === roleFilter;
        const shiftMatch = shiftFilter === 'All' || member.shiftId === shiftFilter;
        return searchMatch && departmentMatch && roleMatch && shiftMatch;
    });
  }, [teamMembers, searchQuery, departmentFilter, roleFilter, shiftFilter, isAnyFilterActive]);

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2 mb-4">
        <div className="flex flex-col sm:flex-row gap-2 w-full">
            <div className="relative w-full sm:w-48">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search name or email..."
                    className="pl-8 w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by department..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="All">All Departments</SelectItem>
                    {departmentOptions.map(deptName => (
                        <SelectItem key={deptName} value={deptName}>{deptName}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-[120px]">
                    <SelectValue placeholder="Filter by role..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="All">All Roles</SelectItem>
                    <SelectItem value="Owner">Owner</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Reception">Reception</SelectItem>
                    <SelectItem value="Member">Member</SelectItem>
                </SelectContent>
            </Select>
             <Select value={shiftFilter} onValueChange={setShiftFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="Filter by shift..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="All">All Shifts</SelectItem>
                    {shifts.map(shift => (
                        <SelectItem key={shift.id} value={shift.id}>{shift.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        {role === 'admin' && (
          <div className="flex w-full sm:w-auto">
              <Button onClick={() => handleOpenDialog()} disabled={departments.length === 0} className="w-full">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Member
              </Button>
          </div>
        )}
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              {role === 'admin' && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isAnyFilterActive && filteredTeamMembers.length > 0 ? filteredTeamMembers.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">
                    <div>{member.name}</div>
                    <div className="text-xs text-muted-foreground">{member.email}</div>
                </TableCell>
                <TableCell>
                    <Badge className={cn(departmentColors[member.department] || 'bg-gray-500')}>{member.department}</Badge>
                     {member.department === 'F&B' && member.restaurantId && (
                        <Badge variant="outline" className="ml-2">
                            {restaurants.find(r => r.id === member.restaurantId)?.name || 'N/A'}
                        </Badge>
                    )}
                </TableCell>
                <TableCell>
                    <Badge className={cn(roleColors[member.role])}>{member.role}</Badge>
                </TableCell>
                 <TableCell>
                    <Badge variant="default" className="bg-green-500">Registered</Badge>
                </TableCell>
                {role === 'admin' && (
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="mr-2" onClick={() => handleOpenDialog(member)}>
                      <Edit className="mr-2 h-4 w-4"/> Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="mr-2 h-4 w-4"/> Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This removes the member from the hotel's team. For full security, you must also manually delete their login account from the Firebase Authentication console.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDelete(member.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                )}
              </TableRow>
            )) : (
                <TableRow>
                    <TableCell colSpan={role === 'admin' ? 5 : 4} className="h-24 text-center">
                        {isAnyFilterActive ? "No team members found for the selected filters." : "Please search for a member or use the filters to display the team list."}
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <EditTeamMemberDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onSave={onSave}
        member={selectedMember}
        departments={departments}
        shifts={shifts}
        restaurants={restaurants}
      />
    </>
  );
}
