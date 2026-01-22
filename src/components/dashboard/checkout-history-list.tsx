'use client';

import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import type { CheckedOutStay } from '@/lib/types';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { Search, Calendar as CalendarIcon, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';
import { useSettings } from '@/context/settings-context';
import { StayHistoryDialog } from './stay-history-dialog';

interface CheckoutHistoryListProps {
  checkedOutStays: CheckedOutStay[];
}

export function CheckoutHistoryList({ checkedOutStays }: CheckoutHistoryListProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [selectedStay, setSelectedStay] = useState<CheckedOutStay | null>(null);
    const { formatPrice } = useSettings();

    const filteredStays = useMemo(() => {
        let stays = checkedOutStays || [];

        // Filter by date range first
        if (dateRange?.from) {
            const toDate = dateRange.to || dateRange.from;
            const interval = { start: startOfDay(dateRange.from), end: endOfDay(toDate) };
            stays = stays.filter(stay => isWithinInterval(new Date(stay.checkOutDate), interval));
        }

        // Then filter by search query
        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            stays = stays.filter(stay => 
                stay.guestName.toLowerCase().includes(lowercasedQuery) ||
                stay.stayId.toLowerCase().includes(lowercasedQuery) ||
                stay.roomNumber.toLowerCase().includes(lowercasedQuery)
            );
        }

        return stays.sort((a, b) => new Date(b.checkOutDate).getTime() - new Date(a.checkOutDate).getTime());
    }, [checkedOutStays, searchQuery, dateRange]);

    if (!checkedOutStays) {
        return <div className="text-center p-8">Loading...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search by guest, room, or stay ID..."
                        className="pl-8 w-full"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-full sm:w-[300px] justify-start text-left font-normal",
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
                        <span>Filter by checkout date...</span>
                        )}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
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
            </div>
            
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Guest</TableHead>
                            <TableHead>Room</TableHead>
                            <TableHead>Dates</TableHead>
                            <TableHead>Total Bill</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredStays.length > 0 ? (
                            filteredStays.map((stay) => (
                                <TableRow key={stay.stayId}>
                                    <TableCell className="font-medium">{stay.guestName}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span>{stay.roomNumber}</span>
                                            <span className="text-xs text-muted-foreground">{stay.roomType}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(stay.checkInDate), 'MMM d, yyyy')} - {format(new Date(stay.checkOutDate), 'MMM d, yyyy')}
                                    </TableCell>
                                    <TableCell className="font-mono">{formatPrice(stay.finalBill.total)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" onClick={() => setSelectedStay(stay)}>
                                            <Info className="mr-2 size-4" />
                                            View Details
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No past stays found for the selected filters.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <StayHistoryDialog
                isOpen={!!selectedStay}
                onClose={() => setSelectedStay(null)}
                stay={selectedStay}
            />
        </div>
    );
}
