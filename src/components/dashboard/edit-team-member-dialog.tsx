

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
import type { TeamMember, TeamDepartment, TeamRole, Department, Shift, Restaurant } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Lock } from 'lucide-react';

interface EditTeamMemberDialogProps {
  member: Partial<TeamMember> | null;
  departments: Department[];
  shifts: Shift[];
  restaurants: Restaurant[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: Partial<TeamMember>, password?: string) => void;
}

const roles: TeamRole[] = ['Owner', 'Admin', 'Manager', 'Reception', 'Member'];

export function EditTeamMemberDialog({ member, departments, shifts, restaurants, isOpen, onClose, onSave }: EditTeamMemberDialogProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState<TeamDepartment>('');
  const [role, setRole] = useState<TeamRole>('Member');
  const [shiftId, setShiftId] = useState<string>('');
  const [restaurantId, setRestaurantId] = useState<string | undefined>(undefined);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const isEditing = member && member.id;

  useEffect(() => {
    if (isOpen) {
      if (member) {
        setName(member.name || '');
        setEmail(member.email || '');
        setDepartment(member.department || (departments.length > 0 ? departments[0].name : ''));
        setRole(member.role || 'Member');
        setShiftId(member.shiftId || (shifts.length > 0 ? shifts[0].id : ''));
        setRestaurantId(member.restaurantId || undefined);
        setPassword(''); // Always clear password on open
      } else {
        setName('');
        setEmail('');
        setDepartment(departments.length > 0 ? departments[0].name : '');
        setRole('Member');
        setShiftId(shifts.length > 0 ? shifts[0].id : '');
        setRestaurantId(undefined);
        setPassword('');
      }
    }
  }, [member, isOpen, departments, shifts]);

  const handleSave = () => {
    let finalDepartment = department;
    if (role === 'Owner' || role === 'Admin') {
        finalDepartment = 'Administration';
    } else if (role === 'Reception') {
        finalDepartment = 'Front Office';
    }
    
    const finalRestaurantId = finalDepartment === 'F&B' ? restaurantId : undefined;

    if (!name || !email || !finalDepartment || !role || !shiftId) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill out all required fields for the team member.",
      });
      return;
    }

    if (!isEditing && !password) {
        toast({
            variant: "destructive",
            title: "Password Required",
            description: "Please set an initial password for the new team member.",
        });
        return;
    }
    
    onSave({ id: member?.id, name, email, department: finalDepartment, role, shiftId, restaurantId: finalRestaurantId }, password);
    onClose();
  };
  
  if (!isOpen) return null;

  const isDepartmentSpecificRole = role === 'Manager' || role === 'Member';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Team Member' : 'Create New Team Member Profile'}</DialogTitle>
          <DialogDescription>
            {isEditing ? `Update the details for ${member?.name}.` : 'Create a complete profile for the new team member.'}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="member-name">Full Name</Label>
                <Input id="member-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., John Doe" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="member-email">Email Address</Label>
                <Input id="member-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g., john.d@example.com" disabled={!!isEditing} />
            </div>
          </div>
          
           {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="password">Set Initial Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="pl-9" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground">
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="member-role">Role</Label>
                <Select value={role} onValueChange={(value) => setRole(value as TeamRole)}>
                    <SelectTrigger id="member-role">
                        <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                        {roles.map((r) => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            {isDepartmentSpecificRole && (
                <div className="space-y-2">
                    <Label htmlFor="member-department">Department</Label>
                    <Select value={department} onValueChange={(value) => setDepartment(value as TeamDepartment)}>
                        <SelectTrigger id="member-department">
                            <SelectValue placeholder="Select a department" />
                        </SelectTrigger>
                        <SelectContent>
                            {departments.filter(d => !['Administration', 'Front Office'].includes(d.name)).map((dept) => (
                                <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
          </div>
           {department === 'F&B' && isDepartmentSpecificRole && (
              <div className="space-y-2">
                <Label htmlFor="member-restaurant">Kitchen / Restaurant</Label>
                <Select value={restaurantId} onValueChange={setRestaurantId}>
                    <SelectTrigger id="member-restaurant">
                        <SelectValue placeholder="Assign to a kitchen..." />
                    </SelectTrigger>
                    <SelectContent>
                        {restaurants.map((r) => (
                            <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
           )}
           <div className="space-y-2">
                <Label htmlFor="member-shift">Shift</Label>
                <Select value={shiftId} onValueChange={setShiftId}>
                    <SelectTrigger id="member-shift">
                        <SelectValue placeholder="Select a shift" />
                    </SelectTrigger>
                    <SelectContent>
                        {shifts.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name} ({s.startTime} - {s.endTime})</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>
            {isEditing ? 'Save Changes' : 'Create Member'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
