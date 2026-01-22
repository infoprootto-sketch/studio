
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Check, Download, Calendar as CalendarIcon, Wallet, Mail } from 'lucide-react';
import type { CorporateClient, BilledOrder, BilledOrderStatus } from '@/lib/types';
import { useSettings } from '@/context/settings-context';
import { cn } from '@/lib/utils';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import type { DateRange } from 'react-day-picker';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';


interface ClientBillingHistoryDialogProps {
  client: CorporateClient | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkOrderAsPaid: (clientId: string, orderId: string) => void;
  onViewStayDetails: (stayId: string) => void;
}

export function ClientBillingHistoryDialog({ client, isOpen, onClose, onMarkOrderAsPaid, onViewStayDetails }: ClientBillingHistoryDialogProps) {
  const { formatPrice } = useSettings();
  const { toast } = useToast();
  
  const [statusFilter, setStatusFilter] = useState<BilledOrderStatus | 'All'>('All');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);

  const filteredOrders = useMemo(() => {
    let orders = client?.billedOrders || [];

    if (statusFilter !== 'All') {
      orders = orders.filter(order => order.status === statusFilter);
    }
    
    if (dateRange?.from) {
        const interval = { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to || dateRange.from) };
        orders = orders.filter(order => isWithinInterval(order.date, interval));
    }

    return orders;
  }, [client, statusFilter, dateRange]);

  const pendingBalance = useMemo(() => {
    return (client?.billedOrders || [])
      .filter(order => order.status === 'Pending')
      .reduce((sum, order) => sum + order.amount, 0);
  }, [client]);

  const handleDownload = () => {
    toast({
      title: "Download Initiated (Placeholder)",
      description: "In a real app, a CSV/PDF of the filtered summary would be downloaded.",
    });
    console.log("Downloading summary for:", filteredOrders);
  };
  
  useEffect(() => {
    if (!isOpen) {
        // Reset state on close
        setStatusFilter('All');
        setDateRange(undefined);
        setSelectedOrderIds([]);
    }
  }, [isOpen]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrderIds(filteredOrders.map(order => order.id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrderIds(prev => [...prev, orderId]);
    } else {
      setSelectedOrderIds(prev => prev.filter(id => id !== orderId));
    }
  };

  const selectedOrders = useMemo(() => {
    return client?.billedOrders?.filter(order => selectedOrderIds.includes(order.id)) || [];
  }, [selectedOrderIds, client]);

  if (!isOpen || !client) return null;
  
  const orders = client.billedOrders || [];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Billing History for {client.name}</DialogTitle>
            <DialogDescription>
              Review all billed orders for this client. You can filter by status and date range.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4 flex-1 min-h-0">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Pending Balance</CardTitle>
                          <Wallet className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                          <div className="text-2xl font-bold">{formatPrice(pendingBalance)}</div>
                          <p className="text-xs text-muted-foreground">Total amount due from pending bills</p>
                      </CardContent>
                  </Card>
                  <div className="md:col-span-3 bg-muted/50 p-4 rounded-lg flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Status:</span>
                          <Button variant={statusFilter === 'All' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('All')}>All</Button>
                          <Button variant={statusFilter === 'Pending' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('Pending')}>Pending</Button>
                          <Button variant={statusFilter === 'Paid' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('Paid')}>Paid</Button>
                      </div>
                      <Popover>
                          <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full sm:w-auto justify-start text-left font-normal">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dateRange?.from ? `${format(dateRange.from, "LLL dd, y")} - ${dateRange.to ? format(dateRange.to, "LLL dd, y") : '...'}` : <span>Filter by date range...</span>}
                          </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                          <Calendar
                              mode="range"
                              selected={dateRange}
                              onSelect={setDateRange}
                              initialFocus
                          />
                          </PopoverContent>
                      </Popover>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button onClick={handleDownload} variant="outline" className="flex-1 sm:flex-initial">
                            <Download className="mr-2 h-4 w-4"/>
                            Summary
                        </Button>
                        <Button onClick={() => toast({ title: 'Email functionality is disabled.'})} disabled={selectedOrderIds.length === 0} className="flex-1 sm:flex-initial">
                            <Mail className="mr-2 h-4 w-4"/>
                            Email ({selectedOrderIds.length})
                        </Button>
                      </div>
                  </div>
              </div>
              <ScrollArea className="flex-1 border rounded-lg">
                  <Table>
                  <TableHeader>
                      <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                            checked={selectedOrderIds.length > 0 && selectedOrderIds.length === filteredOrders.length}
                            onCheckedChange={handleSelectAll}
                            aria-label="Select all"
                        />
                      </TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Guest</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {filteredOrders.length > 0 ? (
                      filteredOrders.map(order => (
                          <TableRow key={order.id} data-state={selectedOrderIds.includes(order.id) && "selected"}>
                          <TableCell>
                            <Checkbox
                                checked={selectedOrderIds.includes(order.id)}
                                onCheckedChange={(checked) => handleSelectOrder(order.id, !!checked)}
                                aria-label="Select order"
                            />
                          </TableCell>
                          <TableCell>{format(order.date, 'MMM d, yyyy')}</TableCell>
                          <TableCell>{order.guestName}</TableCell>
                          <TableCell>{order.roomNumber}</TableCell>
                          <TableCell>
                              <Badge className={cn(order.status === 'Paid' ? 'bg-green-500' : 'bg-yellow-500 text-yellow-950')}>
                              {order.status}
                              </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">{formatPrice(order.amount)}</TableCell>
                          <TableCell className="text-right space-x-2">
                              <Button size="sm" variant="outline" onClick={() => onViewStayDetails(order.stayId)}>
                              <FileText className="mr-2 h-4 w-4"/> Details
                              </Button>
                              {order.status === 'Pending' && (
                              <Button size="sm" onClick={() => onMarkOrderAsPaid(client.id, order.id)}>
                                  <Check className="mr-2 h-4 w-4"/> Mark as Paid
                              </Button>
                              )}
                          </TableCell>
                          </TableRow>
                      ))
                      ) : (
                      <TableRow>
                          <TableCell colSpan={7} className="text-center h-24">
                          No billing history found for the selected filters.
                          </TableCell>
                      </TableRow>
                      )}
                  </TableBody>
                  </Table>
              </ScrollArea>
          </div>
          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
