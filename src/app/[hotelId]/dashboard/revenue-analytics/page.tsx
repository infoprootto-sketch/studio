
'use client';
import React, { useMemo, useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RevenuePageContent from '@/components/dashboard/revenue-page-content';
import AnalyticsPageContent from '@/components/dashboard/analytics-page-content';
import { useRoomState } from '@/context/room-context';
import { useServices } from '@/context/service-context';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Download, ChevronLeft, ChevronRight, LogOut, DollarSign, Calendar as CalendarIcon } from 'lucide-react';
import { CombinedAnalyticsReport } from '@/components/dashboard/combined-analytics-report';
import type { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn, isToday } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { useHotelId } from '@/context/hotel-id-context';
import { collection } from 'firebase/firestore';
import type { CheckedOutStay } from '@/lib/types';
import { useAdminBillingCalculator } from '@/hooks/use-admin-billing-calculator';
import { useRevenueAnalytics } from '@/hooks/use-revenue-analytics';
import { useServiceAnalytics } from '@/hooks/use-service-analytics';
import { useOccupancyAnalytics } from '@/hooks/use-occupancy-analytics';


export default function RevenueAnalyticsPage() {
    const { rooms } = useRoomState();
    const { serviceRequests, restaurants } = useServices();
    const [isClient, setIsClient] = useState(false);
    
    const firestore = useFirestore();
    const hotelId = useHotelId();
    const { user, isUserLoading } = useUser();
    
    const checkoutHistoryCollectionRef = useMemoFirebase(() => (firestore && hotelId && user && !isUserLoading ? collection(firestore, 'hotels', hotelId, 'checkoutHistory') : null), [firestore, hotelId, user, isUserLoading]);
    const { data: checkoutHistoryData } = useCollection<CheckedOutStay>(checkoutHistoryCollectionRef);

    const { getBillSummary } = useAdminBillingCalculator();
    
    const checkoutHistory = useMemo(() => {
        if (!checkoutHistoryData) return [];
        return checkoutHistoryData.map(s => ({
            ...s, 
            checkInDate: (s.checkInDate as any)?.toDate ? (s.checkInDate as any).toDate() : new Date(s.checkInDate), 
            checkOutDate: (s.checkOutDate as any)?.toDate ? (s.checkOutDate as any).toDate() : new Date(s.checkOutDate)
        }));
    }, [checkoutHistoryData]);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const [date, setDate] = useState<DateRange | undefined>(undefined);

    const { revenueAnalyticsData } = useRevenueAnalytics(checkoutHistory, date);
    const { serviceAnalyticsData } = useServiceAnalytics(serviceRequests, checkoutHistory, date, restaurants);
    const { occupancyAnalyticsData } = useOccupancyAnalytics(rooms, date);


    const handlePrint = () => {
        const printContent = document.getElementById('printable-combined-report');
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
    
       const { todaysDepartures, expectedRevenue } = useMemo(() => {
        if (!isClient) return { todaysDepartures: [], expectedRevenue: 0 };

        const departures = rooms.filter(room => 
          room.displayStatus === 'Occupied' && 
          room.stayId && 
          isToday(new Date(room.stays.find(s => s.stayId === room.stayId)?.checkOutDate || ''))
        );
        
        const revenue = departures.reduce((sum, room) => {
            const stay = room.stays.find(s => s.stayId === room.stayId);
            if (stay) {
                const { currentBalance } = getBillSummary(stay, room);
                return sum + currentBalance;
            }
            return sum;
        }, 0);
        
        return {
          todaysDepartures: departures,
          expectedRevenue: revenue,
        };
      }, [rooms, getBillSummary, isClient]);


    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight font-headline">Revenue &amp; Service Analytics</h1>
                    <p className="text-muted-foreground">
                        Comprehensive performance overview for: <span className="font-semibold text-primary">{revenueAnalyticsData.filterLabel}</span>
                    </p>
                </div>
                 <div className="flex items-center gap-2 pt-2 md:pt-0">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className={cn("w-full sm:w-[280px] justify-start text-left font-normal", !date && "text-muted-foreground")}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {revenueAnalyticsData.filterLabel}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={date?.from}
                            selected={date}
                            onSelect={setDate}
                            numberOfMonths={2}
                        />
                        </PopoverContent>
                    </Popover>

                    <Button variant="outline" onClick={handlePrint}>
                        <Download className="mr-2" /> Report
                    </Button>
                </div>
            </div>
            <Tabs defaultValue="revenue">
                <TabsList>
                    <TabsTrigger value="revenue">Revenue Overview</TabsTrigger>
                    <TabsTrigger value="services">Service Analytics</TabsTrigger>
                </TabsList>
                <TabsContent value="revenue">
                   <RevenuePageContent 
                        data={revenueAnalyticsData} 
                        occupancyData={occupancyAnalyticsData}
                        todaysDepartures={todaysDepartures.length}
                        expectedRevenue={expectedRevenue}
                    />
                </TabsContent>
                <TabsContent value="services">
                    <AnalyticsPageContent data={serviceAnalyticsData} />
                </TabsContent>
            </Tabs>
             <div className="hidden">
                 <CombinedAnalyticsReport
                    id="printable-combined-report"
                    revenueData={revenueAnalyticsData}
                    serviceData={serviceAnalyticsData}
                    occupancyData={occupancyAnalyticsData}
                 />
            </div>
        </div>
    )
}
