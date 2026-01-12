
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, UserX, Briefcase, Download } from 'lucide-react';
import type { TeamMember, AttendanceRecord } from '@/lib/types';
import { format, differenceInHours, startOfMonth, endOfMonth, isSameMonth, eachMonthOfInterval, getDaysInMonth, isWeekend, isSameDay, isValid } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface AttendanceHistoryDialogProps {
  member: TeamMember | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AttendanceHistoryDialog({ member, isOpen, onClose }: AttendanceHistoryDialogProps) {
  const [selectedMonthDate, setSelectedMonthDate] = useState<Date>(new Date());
  const { toast } = useToast();

  const months = useMemo(() => {
    if (!member || !member.attendanceHistory || member.attendanceHistory.length === 0) {
      return [new Date()];
    }
    const historyDates = member.attendanceHistory.map(h => h.date);
    const firstEntry = historyDates.reduce((min, d) => d < min ? d : min, historyDates[0]);
    const lastEntry = historyDates.reduce((max, d) => d > max ? d : max, historyDates[0]);

    if (!isValid(firstEntry) || !isValid(lastEntry)) {
        return [new Date()];
    }

    const allMonths = eachMonthOfInterval({
        start: firstEntry,
        end: lastEntry,
    }).reverse();

    if (!allMonths.some(d => isSameMonth(d, new Date()))) {
        allMonths.unshift(new Date());
    }
    
    return allMonths;
  }, [member]);

  const filteredHistory = useMemo(() => {
    if (!member || !member.attendanceHistory) return [];
    return member.attendanceHistory.filter(record => 
        isValid(record.date) && isSameMonth(record.date, selectedMonthDate)
    ).sort((a,b) => b.date.getTime() - a.date.getTime());
  }, [member, selectedMonthDate]);

  const summaryStats = useMemo(() => {
    if (!member) return { totalHours: 0, totalShifts: 0, daysAbsent: 0 };

    const totalHours = filteredHistory.reduce((sum, record) => {
        if (record.clockOut && isValid(record.clockOut) && isValid(record.clockIn)) {
            return sum + differenceInHours(record.clockOut, record.clockIn);
        }
        return sum;
    }, 0);
    
    const totalShifts = filteredHistory.length;

    const monthStart = startOfMonth(selectedMonthDate);
    const daysInMonth = getDaysInMonth(monthStart);
    let daysAbsent = 0;
    
    for (let i = 1; i <= daysInMonth; i++) {
        const day = new Date(monthStart.getFullYear(), monthStart.getMonth(), i);
        if (!isWeekend(day) && !filteredHistory.some(rec => isValid(rec.date) && isSameDay(rec.date, day))) {
            daysAbsent++;
        }
    }

    return { totalHours, totalShifts, daysAbsent };
  }, [filteredHistory, selectedMonthDate, member]);

  const handleDownload = () => {
    if (!member || filteredHistory.length === 0) {
      toast({
        variant: "destructive",
        title: "No Data to Download",
        description: "There is no attendance data for the selected period.",
      });
      return;
    }

    const headers = ['Date', 'Clock In', 'Clock Out', 'Total Hours'];
    const rows = filteredHistory.map(record => [
      isValid(record.date) ? format(record.date, 'yyyy-MM-dd') : 'Invalid Date',
      isValid(record.clockIn) ? format(record.clockIn, 'HH:mm:ss') : 'N/A',
      record.clockOut && isValid(record.clockOut) ? format(record.clockOut, 'HH:mm:ss') : 'N/A',
      record.clockOut && isValid(record.clockOut) && isValid(record.clockIn) ? differenceInHours(record.clockOut, record.clockIn) : 0
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_${member.name.replace(' ', '_')}_${format(selectedMonthDate, 'yyyy-MM')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Download Started",
      description: `The attendance report for ${member.name} is being downloaded.`,
    });
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedMonthDate(new Date());
    }
  }, [isOpen]);

  if (!isOpen || !member) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>Attendance History for {member.name}</DialogTitle>
                <DialogDescription>Review historical attendance records for this team member.</DialogDescription>
            </DialogHeader>

            <div className="flex-shrink-0 space-y-4">
                <div className="flex items-center gap-4">
                    <Select 
                        value={format(selectedMonthDate, 'yyyy-MM')} 
                        onValueChange={(val) => setSelectedMonthDate(new Date(val + '-02'))}
                    >
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Select month..." />
                        </SelectTrigger>
                        <SelectContent>
                             {months.map(m => (
                                <SelectItem key={format(m, 'yyyy-MM')} value={format(m, 'yyyy-MM')}>
                                    {format(m, 'MMMM yyyy')}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                
                 <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Hours Worked</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summaryStats.totalHours} hrs</div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Shifts Worked</CardTitle>
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summaryStats.totalShifts}</div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Days Absent (Mon-Fri)</CardTitle>
                            <UserX className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summaryStats.daysAbsent}</div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <ScrollArea className="flex-1 min-h-0 pt-4 border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Clock In</TableHead>
                            <TableHead>Clock Out</TableHead>
                            <TableHead>Total Hours</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredHistory.length > 0 ? (
                            filteredHistory.map((record) => (
                                <TableRow key={record.date.toString()}>
                                    <TableCell>{isValid(record.date) ? format(record.date, 'eee, MMM d, yyyy') : 'Invalid Date'}</TableCell>
                                    <TableCell>{isValid(record.clockIn) ? format(record.clockIn, 'h:mm a') : 'N/A'}</TableCell>
                                    <TableCell>{record.clockOut && isValid(record.clockOut) ? format(record.clockOut, 'h:mm a') : 'N/A'}</TableCell>
                                    <TableCell>{record.clockOut && isValid(record.clockOut) && isValid(record.clockIn) ? `${differenceInHours(record.clockOut, record.clockIn)}h` : '-'}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">
                                    No attendance records for this month.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </ScrollArea>

            <DialogFooter className="flex-shrink-0 pt-4 sm:justify-between">
                 <Button variant="outline" onClick={handleDownload}>
                    <Download className="mr-2" />
                    Download Report
                </Button>
                <Button onClick={onClose}>Close</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  )
}
