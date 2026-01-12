
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { TeamManagementTable } from '@/components/dashboard/team-management-table';
import { DepartmentManagement } from '@/components/dashboard/department-management';
import { SlaManagement } from '@/components/dashboard/sla-management';
import type { TeamMember, Department, ServiceCategory, SlaRule, Shift, Restaurant } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ShiftManagement } from '@/components/dashboard/shift-management';
import { AttendanceViewer } from '@/components/dashboard/attendance-viewer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TeamAnalyticsPage from '@/components/dashboard/team-analytics/page';
import { useServices } from "@/context/service-context";
import { useTeam } from "@/context/team-context";
import React, { useMemo } from 'react';
import { useAuth, useUser } from "@/firebase";

const isRegistered = (id: string) => id.length > 20;

export default function TeamPage({ role = 'admin' }: { role?: 'admin' | 'manager' }) {
    const auth = useAuth();
    const { user } = useUser();
    const { restaurants, serviceCategories, updateRestaurant, updateHotelService } = useServices();
    const { 
        teamMembers,
        departments, addDepartment, updateDepartment, deleteDepartment, 
        shifts, addShift, updateShift, deleteShift, 
        saveTeamMember, deleteTeamMember
    } = useTeam();
    const { toast } = useToast();

    const allServiceCategories = useMemo(() => {
        const restaurantCats = (restaurants || []).map(r => ({ id: r.id, name: r.name, slaMinutes: r.slaMinutes, type: 'F&B' as const }));
        const otherCats = (serviceCategories || []).filter(sc => sc.type === 'Other');
        return [...restaurantCats, ...otherCats];
    }, [restaurants, serviceCategories]);

    const handleSlaUpdate = (id: string, name: string, slaMinutes: number, type: 'F&B' | 'Other') => {
        if (type === 'F&B') {
            updateRestaurant(id, { slaMinutes });
        } else {
             // The update logic is handled within useServices, no need for direct firestore calls here
        }
    };
    
    const handleSaveMember = async (memberData: Partial<TeamMember>, password?: string) => {
        const success = await saveTeamMember(memberData);
        if (success) {
            toast({
                title: memberData.id ? "Team Member Updated" : "Team Member Created",
                description: `The details for ${memberData.name} have been processed.`,
            });
        } else {
             toast({
                variant: "destructive",
                title: "Operation Failed",
                description: "Could not save team member details. Please try again.",
            });
        }
    };

    const handleDeleteMember = async (memberId: string) => {
        if (memberId === user?.uid) {
            toast({
                variant: "destructive",
                title: "Action Prohibited",
                description: "You cannot delete your own account.",
            });
            return;
        }

        const success = await deleteTeamMember(memberId);
        if (success) {
             toast({
                title: "Team Member Removed",
                description: `The team member has been removed. Manually delete their login from Firebase Auth.`,
                variant: "destructive",
                duration: 10000,
            });
        } else {
             toast({
                variant: "destructive",
                title: "Deletion Failed",
                description: "Could not remove the team member. Please try again.",
            });
        }
    };
    
    const handleSaveDepartment = (deptData: Partial<Department>) => {
        if (deptData.id) {
            updateDepartment(deptData.id, deptData);
            toast({ title: "Department Updated", description: `"${deptData.name}" has been updated.` });
        } else {
            const newDept: Omit<Department, 'id'> = {
                name: deptData.name!,
                manages: deptData.manages || [],
            };
            addDepartment(newDept);
            toast({ title: "Department Added", description: `"${newDept.name}" has been added.` });
        }
    };

    const handleDeleteDepartment = (deptId: string) => {
        const deptName = departments.find(d => d.id === deptId)?.name;
        const membersInDept = teamMembers.filter(member => member.department === deptName);

        if (membersInDept.length > 0) {
            toast({
                variant: "destructive",
                title: "Cannot Delete Department",
                description: "Team Member assigned to this department change that first.",
            });
            return;
        }

        deleteDepartment(deptId);
        toast({ title: "Department Deleted", description: `"${deptName}" has been removed.`, variant: 'destructive' });
    };

    const handleSaveShift = (shiftData: Partial<Shift>) => {
        if (shiftData.id) {
            updateShift(shiftData.id, shiftData);
            toast({ title: "Shift Updated" });
        } else {
            const newShift: Omit<Shift, 'id'> = {
                name: shiftData.name!,
                startTime: shiftData.startTime!,
                endTime: shiftData.endTime!,
            };
            addShift(newShift);
            toast({ title: "Shift Added" });
        }
    };

    const handleDeleteShift = (shiftId: string) => {
        const shift = shifts.find(s => s.id === shiftId);
        const membersInShift = teamMembers.filter(member => member.shiftId === shiftId);

        if (membersInShift.length > 0) {
             toast({
                variant: "destructive",
                title: "Cannot Delete Shift",
                description: `This shift is assigned to ${membersInShift.length} member(s). Please re-assign them first.`,
            });
            return;
        }
        deleteShift(shiftId);
        toast({ title: "Shift Deleted", description: `The "${shift?.name}" shift has been removed.`, variant: 'destructive' });
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight font-headline">Team Management</h1>
                <p className="text-muted-foreground">Oversee all aspects of your hotel staff, departments, and service levels.</p>
            </div>
            <Tabs defaultValue="attendance">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
                    <TabsTrigger value="attendance">Attendance</TabsTrigger>
                    <TabsTrigger value="shifts">Shifts</TabsTrigger>
                    <TabsTrigger value="departments">Departments</TabsTrigger>
                    <TabsTrigger value="members">Team Members</TabsTrigger>
                    <TabsTrigger value="sla">SLA</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="attendance" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Team Attendance Overview</CardTitle>
                            <CardDescription>Oversee team member attendance records and live status. Click a member to view their history.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AttendanceViewer
                                teamMembers={teamMembers}
                                shifts={shifts}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="shifts">
                    <Card>
                        <CardHeader>
                            <CardTitle>Shift Management</CardTitle>
                            <CardDescription>Create and manage custom work shifts for your team.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ShiftManagement 
                                shifts={shifts}
                                onSave={handleSaveShift}
                                onDelete={handleDeleteShift}
                                role={role}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="departments">
                    <Card>
                        <CardHeader>
                            <CardTitle>Department Management</CardTitle>
                            <CardDescription>Create custom teams and assign the service categories they manage.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DepartmentManagement
                                departments={departments}
                                onSave={handleSaveDepartment}
                                onDelete={handleDeleteDepartment}
                                role={role}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="members">
                    <Card>
                        <CardHeader>
                            <CardTitle>Team Member Management</CardTitle>
                            <CardDescription>Create and manage profiles for your hotel staff within their departments.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <TeamManagementTable 
                                teamMembers={teamMembers}
                                departments={departments}
                                shifts={shifts}
                                restaurants={restaurants}
                                onSave={handleSaveMember}
                                onDelete={handleDeleteMember}
                                role={role}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="sla">
                    <Card>
                        <CardHeader>
                            <CardTitle>SLA Management</CardTitle>
                            <CardDescription>Set time limits (in minutes) for service categories to ensure timely completion.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <SlaManagement
                                categories={allServiceCategories}
                                onUpdate={handleSlaUpdate}
                                role={role}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                 <TabsContent value="analytics">
                    <TeamAnalyticsPage role="admin" />
                </TabsContent>
            </Tabs>
        </div>
    )
}
