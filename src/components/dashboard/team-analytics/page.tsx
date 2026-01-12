
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { differenceInMinutes, format, startOfMonth, endOfMonth, isWithinInterval, subMonths, addMonths } from 'date-fns';
import { AlertTriangle, CheckCircle, Clock, Calendar as CalendarIcon, ChevronLeft, ChevronRight, User, Award } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import type { User as AuthUser } from 'firebase/auth';
import { useUser, useDoc, useMemoFirebase } from '@/firebase';
import { useServices } from '@/context/service-context';
import { useTeam } from '@/context/team-context';
import { useHotelId } from '@/context/hotel-id-context';
import { doc } from 'firebase/firestore';
import { Hotel } from '@/lib/types';


const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function TeamAnalyticsPage({ role = 'admin' }: { role?: 'admin' | 'reception' | 'team' }) {
    const { theme } = useTheme();
    const { serviceRequests } = useServices();
    const { teamMembers, departments, slaRules } = useTeam();
    const { user: authUser } = useUser();
    const hotelId = useHotelId();
    const firestore = useUser().firestore;

    const hotelDocRef = useMemoFirebase(() => (firestore && hotelId ? doc(firestore, 'hotels', hotelId) : null), [firestore, hotelId]);
    const { data: hotelData } = useDoc<Hotel>(hotelDocRef);

    const currentUser = useMemo(() => {
        if (!authUser || !teamMembers) return null;
        return teamMembers.find(m => m.id === authUser.uid);
    }, [authUser, teamMembers]);

    const [filterType, setFilterType] = useState<'month' | 'custom'>('month');
    const [currentMonth, setCurrentMonth] = useState<Date | null>(null);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

    useEffect(() => {
        const today = new Date();
        setCurrentMonth(today);
        setDateRange({
          from: startOfMonth(today),
          to: endOfMonth(today),
        });
    }, []);

    const allUsers = useMemo(() => {
        const users = new Map<string, { name: string; department: string }>();
        teamMembers.forEach(tm => users.set(tm.id, { name: tm.name, department: tm.department }));
        
        if (hotelData?.ownerUids) {
            hotelData.ownerUids.forEach(uid => {
                if (!users.has(uid)) {
                    users.set(uid, { name: hotelData.adminName || 'Admin', department: 'Admin' });
                }
            });
        }
        return users;
    }, [teamMembers, hotelData]);

    const analyticsData = useMemo(() => {
        let interval: { start: Date, end: Date };
        if (filterType === 'month' && currentMonth) {
          interval = { start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) };
        } else if (filterType === 'custom' && dateRange?.from && dateRange?.to) {
          interval = { start: dateRange.from, end: dateRange.to };
        } else {
           interval = { start: new Date(0), end: new Date() };
        }

        const completedTasksInRange = serviceRequests.filter(req => 
            req.status === 'Completed' && req.completionTime && isWithinInterval(new Date(req.creationTime), interval)
        );
        
        let relevantTasks = completedTasksInRange;
        let relevantDepartments = departments;

        if (role === 'team' && currentUser?.role === 'Manager') {
            relevantTasks = completedTasksInRange.filter(task => task.staff === currentUser.department);
            relevantDepartments = departments.filter(dept => dept.name === currentUser.department);
        }
        
        const memberStatsMap: Map<string, { id: string; name: string; department: string; tasks: any[] }> = new Map();

        relevantTasks.forEach(task => {
            const memberId = task.assignedTo || task.createdBy;
            if (memberId) {
                if (!memberStatsMap.has(memberId)) {
                    const userData = allUsers.get(memberId) || { name: 'Admin', department: 'Admin' };
                    memberStatsMap.set(memberId, { id: memberId, name: userData.name, department: userData.department, tasks: [] });
                }
                memberStatsMap.get(memberId)!.tasks.push(task);
            } else {
                 if (!memberStatsMap.has('system')) {
                    memberStatsMap.set('system', { id: 'system', name: 'System', department: task.staff || 'System', tasks: [] });
                }
                memberStatsMap.get('system')!.tasks.push(task);
            }
        });
        
        const memberStats = Array.from(memberStatsMap.values()).map(member => {
            const { tasks } = member;
            const totalCompletionTime = tasks.reduce((sum, task) => {
                 if (task.completionTime) {
                    return sum + differenceInMinutes(new Date(task.completionTime), new Date(task.creationTime));
                }
                return sum;
            }, 0);

            const slaBreaches = tasks.filter(task => {
                const rule = slaRules.find(r => r.serviceName === task.category);
                if (!rule || !task.completionTime) return false;
                const completionTime = differenceInMinutes(new Date(task.completionTime), new Date(task.creationTime));
                return completionTime > rule.timeLimitMinutes;
            }).length;

            return {
                ...member,
                tasksCompleted: tasks.length,
                avgCompletionTime: tasks.length > 0 ? totalCompletionTime / tasks.length : 0,
                slaBreaches
            };
        });

        const departmentStats = relevantDepartments.map(dept => {
            const tasks = relevantTasks.filter(task => task.staff === dept.name);
            const deptMembers = memberStats.filter(m => m.department === dept.name);
            const topPerformer = deptMembers.length > 0
                ? deptMembers.reduce((top, current) => current.tasksCompleted > top.tasksCompleted ? current : top)
                : null;
            
            return {
                name: dept.name,
                tasksCompleted: tasks.length,
                topPerformer: topPerformer ? { name: topPerformer.name, tasksCompleted: topPerformer.tasksCompleted } : null
            };
        });
        
        const totalCompletedTasks = relevantTasks.length;
        const totalSlaBreaches = relevantTasks.filter(task => {
                const rule = slaRules.find(r => r.serviceName === task.category);
                if (!rule || !task.completionTime) return false;
                const completionTime = differenceInMinutes(new Date(task.completionTime), new Date(task.creationTime));
                return completionTime > rule.timeLimitMinutes;
            }).length;
        
        const totalCompletionTime = relevantTasks.reduce((sum, task) => {
            if (task.completionTime) {
                return sum + differenceInMinutes(new Date(task.completionTime), new Date(task.creationTime));
            }
            return sum;
        }, 0);

        const totalAvgCompletionTime = totalCompletedTasks > 0
            ? totalCompletionTime / totalCompletedTasks
            : 0;

        return { memberStats, departmentStats, totalSlaBreaches, totalAvgCompletionTime, totalCompletedTasks };

    }, [role, currentUser, filterType, currentMonth, dateRange, allUsers, serviceRequests, departments, slaRules]);
    
    const filterLabel = useMemo(() => {
        if (filterType === 'month' && currentMonth) {
            return format(currentMonth, 'MMMM yyyy');
        }
        if (dateRange?.from) {
            if (dateRange.to) {
                return `${format(dateRange.from, 'MMM d, yyyy')} - ${format(dateRange.to, 'MMM d, yyyy')}`;
            }
            return format(dateRange.from, 'MMM d, yyyy');
        }
        return 'All Time';
    }, [filterType, currentMonth, dateRange]);

    if (!currentMonth) {
        return <div>Loading...</div>; // Or a skeleton loader
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                        <CardTitle>Team Performance Analytics</CardTitle>
                        <CardDescription>Performance metrics for: {filterLabel}</CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 pt-2 md:pt-0">
                         <Select value={filterType} onValueChange={(v) => setFilterType(v as 'month' | 'custom')}>
                            <SelectTrigger className="w-full sm:w-[150px]">
                                <SelectValue placeholder="Filter type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="month">Month View</SelectItem>
                                <SelectItem value="custom">Custom Range</SelectItem>
                            </SelectContent>
                        </Select>
                         {filterType === 'month' ? (
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(p => p ? subMonths(p, 1) : null)}>
                                    <ChevronLeft />
                                </Button>
                                 <div className="text-center font-semibold w-32 hidden sm:block">{format(currentMonth, 'MMMM yyyy')}</div>
                                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(p => p ? addMonths(p, 1) : null)}>
                                    <ChevronRight />
                                </Button>
                            </div>
                        ) : (
                             <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full sm:w-[280px] justify-start text-left font-normal",
                                        !dateRange && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange?.from ? (
                                    dateRange.to ? (
                                        <>
                                        {format(dateRange.from, "LLL dd, y")} -{" "}
                                        {format(dateRange.to, "LLL dd, y")}
                                        </>
                                    ) : (
                                        format(dateRange.from, "LLL dd, y")
                                    )
                                    ) : (
                                    <span>Pick a date range</span>
                                    )}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={dateRange?.from}
                                    selected={dateRange}
                                    onSelect={setDateRange}
                                    numberOfMonths={2}
                                />
                                </PopoverContent>
                            </Popover>
                        )}
                    </div>
                </CardHeader>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Tasks Completed</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analyticsData.totalCompletedTasks}</div>
                        <p className="text-xs text-muted-foreground">
                            {role === 'team' && currentUser ? `In the ${currentUser.department} department` : 'Across all departments'}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total SLA Breaches</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{analyticsData.totalSlaBreaches}</div>
                        <p className="text-xs text-muted-foreground">Tasks that exceeded their time limit</p>
                    </CardContent>
                </Card>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Tasks by Team Member</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analyticsData.memberStats.filter(m => m.tasksCompleted > 0)}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: theme === 'dark' ? 'black' : 'white',
                                        border: `1px solid hsl(var(--border))`
                                    }}
                                />
                                <Bar dataKey="tasksCompleted" fill="hsl(var(--primary))" name="Tasks Completed" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Task Distribution by Department</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={analyticsData.departmentStats.filter(d => d.tasksCompleted > 0)}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="tasksCompleted"
                                    nameKey="name"
                                    fontSize={12}
                                >
                                    {analyticsData.departmentStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                     contentStyle={{
                                        backgroundColor: theme === 'dark' ? 'black' : 'white',
                                        border: `1px solid hsl(var(--border))`
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Department Performance</CardTitle>
                    <CardDescription>Breakdown of completed tasks and top performers by department.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {analyticsData.departmentStats.map(dept => (
                            <Card key={dept.name}>
                                <CardHeader>
                                    <CardTitle>{dept.name}</CardTitle>
                                    <CardDescription>{dept.tasksCompleted} tasks completed</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Award className="size-4 text-yellow-500" />
                                        <span className="font-semibold">Top Performer:</span>
                                    </div>
                                    {dept.topPerformer ? (
                                        <p className="pl-6 text-muted-foreground">{dept.topPerformer.name} ({dept.topPerformer.tasksCompleted} tasks)</p>
                                    ) : (
                                        <p className="pl-6 text-xs text-muted-foreground">No tasks completed by members in this period.</p>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Detailed Task Report</CardTitle>
                    <CardDescription>Breakdown of all completed tasks and their performance for the selected period.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Team Member</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Tasks Completed</TableHead>
                                <TableHead>Avg. Completion Time (min)</TableHead>
                                <TableHead>SLA Breaches</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {analyticsData.memberStats.length > 0 ? analyticsData.memberStats.map(member => (
                                <TableRow key={member.id}>
                                    <TableCell className="font-medium">{member.name}</TableCell>
                                    <TableCell><Badge variant="secondary">{member.department}</Badge></TableCell>
                                    <TableCell>{member.tasksCompleted}</TableCell>
                                    <TableCell>{member.avgCompletionTime.toFixed(1)}</TableCell>
                                    <TableCell>
                                        {member.slaBreaches > 0 ? 
                                            <Badge variant="destructive">{member.slaBreaches}</Badge> : 
                                            <span>0</span>
                                        }
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        No data for the selected period.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
