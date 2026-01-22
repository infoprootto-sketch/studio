
'use client';

import { useMemo, useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ServiceRequest, ServiceRequestStatus, TeamMember, Department, SlaRule } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ListTodo, CheckCircle2, UserPlus, Check, AlertTriangle, User, Hotel, CalendarDays, Download, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AssignTaskDialog } from './assign-task-dialog';
import { differenceInMinutes, formatDistanceToNow, format, isToday, isThisMonth, isWithinInterval, subHours } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useServices } from '@/context/service-context';
import { useTeam } from '@/context/team-context';
import { useUser, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useHotelId } from '@/context/hotel-id-context';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ServiceQueueReport } from './service-queue-report';
import { useSettings } from '@/context/settings-context';
import { useRoomState, useRoomActions } from '@/context/room-context';
import { useInventory } from '@/context/inventory-context';


const statusColors: Record<ServiceRequestStatus, string> = {
    Pending: "border-yellow-500/50 text-yellow-500",
    'In Progress': "border-blue-500/50 text-blue-500",
    Completed: "border-green-500/50 text-green-500",
};

export function ServiceQueue({ role = 'admin' }: { role?: 'admin' | 'reception' | 'team' | 'manager' }) {
    const { serviceRequests } = useServices();
    const { teamMembers, departments, slaRules } = useTeam();
    const { user: authUser } = useUser();
    const firestore = useFirestore();
    const hotelId = useHotelId();
    const { legalName } = useSettings();
    const { rooms, roomCategories } = useRoomState();
    const { updateRoom } = useRoomActions();
    const { inventory, updateInventoryItem, addStockMovement } = useInventory();
    
    const [currentTime, setCurrentTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    const [teamFilter, setTeamFilter] = useState<string>('All');
    const [dateFilter, setDateFilter] = useState<string>('24h');
    const [selectedMonth, setSelectedMonth] = useState<string>('');
    const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
    
    const { toast } = useToast();

    const currentUser = useMemo(() => {
      if (!authUser || !teamMembers) return null;
      return teamMembers.find(m => m.id === authUser.uid);
    }, [authUser, teamMembers]);


    const checkSlaBreach = (request: ServiceRequest): boolean => {
        if (request.status === 'Completed' || !slaRules) return false;
        const rule = slaRules.find(r => r.serviceName === request.category);
        if (!rule) return false;
        const timeElapsed = differenceInMinutes(currentTime, new Date(request.creationTime));
        return timeElapsed > rule.timeLimitMinutes;
    };


    const filteredServices = useMemo(() => {
        let services = serviceRequests || [];
        
        // Date Filtering
        const now = new Date();
        if (dateFilter === '24h') {
            const twentyFourHoursAgo = subHours(now, 24);
            services = services.filter(req => new Date(req.creationTime) >= twentyFourHoursAgo);
        } else if (dateFilter === 'today') {
            services = services.filter(req => isToday(new Date(req.creationTime)));
        } else if (dateFilter === 'thisMonth') {
            services = services.filter(req => isThisMonth(new Date(req.creationTime)));
        } else if (dateFilter === 'customMonth' && selectedMonth) {
            services = services.filter(req => format(new Date(req.creationTime), 'yyyy-MM') === selectedMonth);
        }

        // Team Filtering
        if (teamFilter !== 'All') {
            services = services.filter(req => req.staff === teamFilter);
        }

        return services.sort((a, b) => new Date(b.creationTime).getTime() - new Date(a.creationTime).getTime());
    }, [serviceRequests, teamFilter, dateFilter, selectedMonth]);

    const staffTeams = useMemo(() => {
        if (!departments) return ['All'];
        const departmentNames = departments.map(d => d.name);
        return ['All', ...departmentNames];
    }, [departments]);

    const availableMonths = useMemo(() => {
        const months = new Set(serviceRequests.map(req => format(new Date(req.creationTime), 'yyyy-MM')));
        return Array.from(months).sort().reverse();
    }, [serviceRequests]);

    const filterLabel = useMemo(() => {
        if (dateFilter === '24h') return 'Last 24 Hours';
        if (dateFilter === 'today') return 'Today';
        if (dateFilter === 'thisMonth') return 'This Month';
        if (dateFilter === 'customMonth' && selectedMonth) return format(new Date(`${selectedMonth}-02`), 'MMMM yyyy');
        return 'Last 24 Hours';
    }, [dateFilter, selectedMonth]);


    const pendingServices = useMemo(() => {
        return filteredServices.filter(req => req.status === 'Pending').length;
    }, [filteredServices]);

    const completedServices = useMemo(() => {
        return filteredServices.filter(req => req.status === 'Completed').length;
    }, [filteredServices]);

    const handleOpenAssignDialog = (request: ServiceRequest) => {
      setSelectedRequest(request);
      setIsAssignDialogOpen(true);
    };

    const handleAssignTask = (requestId: string, memberId: string) => {
        if (!firestore || !hotelId) return;
        const requestRef = doc(firestore, 'hotels', hotelId, 'serviceRequests', requestId);
        updateDoc(requestRef, { assignedTo: memberId, status: 'In Progress' });
        const member = teamMembers?.find(m => m.id === memberId);
        toast({
            title: 'Task Assigned',
            description: `The task has been assigned to ${member?.name}.`,
        });
    };

    const handleUpdateStatus = (request: ServiceRequest, newStatus: ServiceRequestStatus, memberId?: string) => {
        if (!firestore || !hotelId) return;
        const requestRef = doc(firestore, 'hotels', hotelId, 'serviceRequests', request.id);
        
        const update: Partial<ServiceRequest> = { status: newStatus };
        if (newStatus === 'In Progress' && memberId) {
            update.assignedTo = memberId;
        }
        if (newStatus === 'Completed') {
            update.completionTime = new Date();
        }

        updateDoc(requestRef, update);

        // If a cleaning task is completed, mark the room as available and deduct inventory.
        if (request.service === 'Post-Checkout Cleaning' && newStatus === 'Completed') {
            const roomToUpdate = rooms.find(r => r.number === request.roomNumber);
            if (roomToUpdate) {
                updateRoom(roomToUpdate.id, { status: 'Available', checkOutDate: null });
                
                // Deduct inventory
                const category = roomCategories.find(c => c.name === roomToUpdate.type);
                if (category && category.cleaningConsumables) {
                  let totalDeductions = 0;
                  
                  category.cleaningConsumables.forEach(consumable => {
                    const inventoryItem = inventory.find(i => i.id === consumable.itemId);
                    if (inventoryItem) {
                      totalDeductions++;
                      updateInventoryItem(inventoryItem.id, { stock: inventoryItem.stock - consumable.quantity });
                      addStockMovement({
                        itemId: inventoryItem.id,
                        itemName: inventoryItem.name,
                        type: 'Consumption',
                        quantity: -consumable.quantity,
                        date: new Date(),
                        notes: `Room ${roomToUpdate.number} cleaning`
                      });
                    }
                  });
                  
                  if (totalDeductions > 0) {
                    toast({
                      title: "Inventory Updated",
                      description: `${totalDeductions} item(s) deducted for cleaning Room ${roomToUpdate.number}.`,
                    });
                  }
                }
            }
        }

        toast({
            title: `Task ${newStatus}`,
            description: `The task has been marked as ${newStatus.toLowerCase()}.`,
        });
    };


    const getMemberName = (memberId: string | undefined | null) => {
      if (!memberId || !teamMembers) return 'Unknown';
      return teamMembers.find(m => m.id === memberId)?.name || 'Unknown Member';
    }

     const handleDownload = () => {
        const printContent = document.getElementById('printable-service-queue');
        if (printContent) {
            const printWindow = window.open('', '_blank', 'height=800,width=800');
            if (printWindow) {
                const styles = Array.from(document.head.getElementsByTagName('link'))
                    .filter(link => link.rel === 'stylesheet')
                    .map(link => link.outerHTML)
                    .join('');

                printWindow.document.write('<html><head><title>Print Report</title>');
                printWindow.document.write(styles);
                 printWindow.document.write(`
                    <style>
                        body { 
                            -webkit-print-color-adjust: exact !important; 
                            color-adjust: exact !important; 
                            padding: 2rem;
                            font-family: sans-serif;
                            background-color: white !important;
                        }
                        .print-container {
                            width: 100%;
                            color: black;
                        }
                        .no-print {
                            display: none !important;
                        }
                    </style>
                `);
                printWindow.document.write('</head><body>');
                printWindow.document.write(printContent.innerHTML);
                printWindow.document.write('</body></html>');
                printWindow.document.close();
                setTimeout(() => {
                    printWindow.print();
                }, 500);
            }
        }
    };


    return (
        <>
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Services</CardTitle>
                            <ListTodo className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{pendingServices}</div>
                            <p className="text-xs text-muted-foreground">Total requests awaiting action in this view.</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Services Completed</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{completedServices}</div>
                            <p className="text-xs text-muted-foreground">Total requests completed in this view.</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">View:</span>
                        <Button size="sm" variant={dateFilter === '24h' ? 'default' : 'outline'} onClick={() => setDateFilter('24h')}>Last 24h</Button>
                        <Button size="sm" variant={dateFilter === 'today' ? 'default' : 'outline'} onClick={() => setDateFilter('today')}>Today</Button>
                        <Button size="sm" variant={dateFilter === 'thisMonth' ? 'default' : 'outline'} onClick={() => setDateFilter('thisMonth')}>This Month</Button>
                        <Select
                            value={dateFilter === 'customMonth' ? selectedMonth : ''}
                            onValueChange={(val) => {
                                setDateFilter('customMonth');
                                setSelectedMonth(val);
                            }}
                        >
                            <SelectTrigger className="w-[180px] h-9 text-sm">
                                <SelectValue placeholder="Select a month..." />
                            </SelectTrigger>
                            <SelectContent>
                                {availableMonths.map(month => (
                                    <SelectItem key={month} value={month}>
                                        {format(new Date(`${month}-02`), 'MMMM yyyy')}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">Team:</span>
                        <Select value={teamFilter} onValueChange={setTeamFilter}>
                            <SelectTrigger className="w-[180px] h-9 text-sm">
                                <SelectValue placeholder="Filter by team..." />
                            </SelectTrigger>
                            <SelectContent>
                                {staffTeams.map(team => (
                                    <SelectItem key={team} value={team}>{team}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button variant="outline" onClick={handleDownload}>
                            <Download className="mr-2" /> Download
                        </Button>
                    </div>
                </div>

                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Room</TableHead>
                                <TableHead>Service</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Source</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Assigned To</TableHead>
                                <TableHead>Requested</TableHead>
                                <TableHead>Completed</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredServices.length > 0 ? filteredServices.map((req) => {
                                const isSlaBreached = checkSlaBreach(req);
                                const isManagerOrAdmin = role === 'admin' || role === 'reception' || (currentUser?.role === 'Manager');
                                return (
                                <TableRow key={req.id}>
                                    <TableCell className="font-medium">{req.roomNumber}</TableCell>
                                    <TableCell>{req.service}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className={cn(statusColors[req.status])}>{req.status}</Badge>
                                            {isSlaBreached && (
                                                <Badge variant="destructive" className="flex items-center gap-1">
                                                    <AlertTriangle className="h-3 w-3" /> SLA BREACHED
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <Badge variant="outline" className="flex items-center gap-1.5 w-fit">
                                                        {req.isManualCharge ? <Hotel className="size-3" /> : <User className="size-3" />}
                                                        {req.isManualCharge ? 'Hotel' : 'Guest'}
                                                    </Badge>
                                                </TooltipTrigger>
                                                {req.isManualCharge && req.createdBy && (
                                                    <TooltipContent>
                                                        <p>Created by: {getMemberName(req.createdBy)}</p>
                                                    </TooltipContent>
                                                )}
                                            </Tooltip>
                                        </TooltipProvider>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{req.staff}</Badge>
                                    </TableCell>
                                     <TableCell>
                                        {req.assignedTo ? (
                                            <Badge>{getMemberName(req.assignedTo)}</Badge>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">Unassigned</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-xs">
                                        {formatDistanceToNow(new Date(req.creationTime), { addSuffix: true })}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-xs">
                                        {req.completionTime ? format(new Date(req.completionTime), 'MMM d, h:mm a') : '-'}
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                      {isManagerOrAdmin && req.status === 'Pending' && (
                                        <Button size="sm" variant="default" onClick={() => handleOpenAssignDialog(req)}>
                                            <UserPlus className="mr-2 h-4 w-4" />
                                            Assign
                                        </Button>
                                      )}
                                      {isManagerOrAdmin && req.status === 'In Progress' && (
                                        <Button size="sm" variant="outline" onClick={() => handleOpenAssignDialog(req)}>
                                            <Repeat className="mr-2 h-4 w-4" />
                                            Reassign
                                        </Button>
                                      )}
                                       {isManagerOrAdmin && req.status !== 'Completed' && (
                                        <Button size="sm" variant="secondary" onClick={() => handleUpdateStatus(req, 'Completed')}>
                                            <Check className="mr-2 h-4 w-4" />
                                            Complete
                                        </Button>
                                      )}
                                      {role === 'team' && currentUser?.role === 'Member' && req.status === 'Pending' && !req.assignedTo && (
                                         <Button size="sm" variant="default" onClick={() => handleUpdateStatus(req, 'In Progress', currentUser.id)}>
                                            Claim Task
                                        </Button>
                                      )}
                                      {role === 'team' && currentUser?.role === 'Member' && req.status === 'In Progress' && req.assignedTo === currentUser.id && (
                                          <Button size="sm" variant="default" onClick={() => handleUpdateStatus(req, 'Completed')}>
                                            <Check className="mr-2 h-4 w-4" /> Complete
                                        </Button>
                                      )}
                                    </TableCell>
                                </TableRow>
                                )
                            }) : (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-24 text-center">
                                        No services found for the selected filters.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <div className="hidden">
                 <ServiceQueueReport
                    id="printable-service-queue"
                    requests={filteredServices}
                    hotelName={legalName}
                    filterLabel={filterLabel}
                    getMemberName={getMemberName}
                 />
            </div>

            <AssignTaskDialog
              isOpen={isAssignDialogOpen}
              onClose={() => setIsAssignDialogOpen(false)}
              request={selectedRequest}
              teamMembers={teamMembers || []}
              departments={departments || []}
              onAssign={handleAssignTask}
            />
        </>
    )

    
}
