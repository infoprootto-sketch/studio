
'use client';
import React, { useMemo, useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RevenuePageContent from '@/components/dashboard/revenue-page-content';
import AnalyticsPageContent from '@/components/dashboard/analytics-page-content';
import { useRoomState } from '@/context/room-context';
import { useServices } from '@/context/service-context';
import { format, isWithinInterval, startOfMonth, endOfMonth, isSameMonth, addMonths, subMonths, startOfDay, endOfDay, differenceInCalendarDays, eachDayOfInterval, isToday, subDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Download, ChevronLeft, ChevronRight, LogOut, DollarSign, Calendar as CalendarIcon } from 'lucide-react';
import { CombinedAnalyticsReport } from '@/components/dashboard/combined-analytics-report';
import type { ChartDataPoint } from '@/components/dashboard/revenue-chart';
import type { RevenueAnalyticsData, ServiceAnalyticsData, OccupancyAnalyticsData } from '@/components/dashboard/combined-analytics-report';
import { useBilling } from '@/context/billing-context';
import type { Room, Stay, ServiceRequest, CheckedOutStay } from '@/lib/types';
import { useSettings } from '@/context/settings-context';
import type { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { useHotelId } from '@/context/hotel-id-context';
import { collection } from 'firebase/firestore';
import { useAdminBillingCalculator } from '@/hooks/use-admin-billing-calculator';


export default function RevenueAnalyticsPage() {
    const { rooms, roomCategories } = useRoomState();
    const { serviceRequests, restaurants } = useServices();
    const { corporateClients } = useBilling();
    const { gstRate, serviceChargeRate, formatPrice } = useSettings();
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

    const [dateRange, setDateRange] = useState<DateRange | undefined>({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    });

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
    
    const handleMonthChange = (direction: 'next' | 'prev') => {
        const currentFrom = dateRange?.from || new Date();
        const newMonth = direction === 'next' ? addMonths(currentFrom, 1) : subMonths(currentFrom, 1);
        setDateRange({
            from: startOfMonth(newMonth),
            to: endOfMonth(newMonth),
        });
    };

    const filterLabel = useMemo(() => {
      if (!dateRange?.from) return "No date selected";
      if (dateRange.to) {
        if (format(dateRange.from, 'yyyy-MM-dd') === format(startOfMonth(dateRange.from), 'yyyy-MM-dd') && format(dateRange.to, 'yyyy-MM-dd') === format(endOfMonth(dateRange.from), 'yyyy-MM-dd')) {
            return format(dateRange.from, 'MMMM yyyy');
        }
        return `${format(dateRange.from, 'LLL dd, yyyy')} - ${format(dateRange.to, 'LLL dd, yyyy')}`;
      }
      return format(dateRange.from, 'LLL dd, yyyy');
    }, [dateRange]);

    const revenueFromPaidCorporateBills = useMemo(() => {
        if (!corporateClients || !dateRange?.from) return 0;
        const interval = { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to || dateRange.from) };
        let total = 0;
        corporateClients.forEach(client => {
            (client.billedOrders || []).forEach(order => {
                if (order.status === 'Paid' && order.paidDate && isWithinInterval(order.paidDate, interval)) {
                    total += order.amount;
                }
            });
        });
        return total;
    }, [corporateClients, dateRange]);


    // Revenue Analytics Calculation
    const revenueAnalyticsData: RevenueAnalyticsData = useMemo(() => {
        if (!dateRange?.from) return { totalRevenue: 0, roomRevenue: 0, serviceRevenue: 0, adr: 0, chartData: [], filterLabel };
        
        const interval = { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to || dateRange.from) };
        
        // Only include stays that have a non-zero total, excluding pending B2B bills
        const relevantStays = checkoutHistory.filter(stay => isWithinInterval(new Date(stay.checkOutDate), interval) && stay.finalBill.total > 0);
        
        const roomRevenue = relevantStays.reduce((sum, stay) => sum + stay.finalBill.roomCharges.amount, 0);
        const serviceRevenue = relevantStays.reduce((sum, stay) => sum + stay.finalBill.serviceCharges.reduce((serviceSum, charge) => serviceSum + (charge.price || 0), 0), 0);
        const totalRevenueFromStays = roomRevenue + serviceRevenue;
        
        const totalRevenue = totalRevenueFromStays + revenueFromPaidCorporateBills;

        const nightsSold = relevantStays.reduce((sum, stay) => sum + (differenceInCalendarDays(new Date(stay.checkOutDate), new Date(stay.checkInDate)) || 1), 0);
        const adr = nightsSold > 0 ? roomRevenue / nightsSold : 0;

        const dailyData = new Map<string, number>();
        eachDayOfInterval(interval).forEach(day => dailyData.set(format(day, 'yyyy-MM-dd'), 0));
        
        relevantStays.forEach(stay => {
            const dayKey = format(new Date(stay.checkOutDate), 'yyyy-MM-dd');
            dailyData.set(dayKey, (dailyData.get(dayKey) || 0) + stay.finalBill.total);
        });

        // Add corporate revenue
        corporateClients.forEach(client => {
            (client.billedOrders || []).forEach(order => {
                if (order.status === 'Paid' && order.paidDate && isWithinInterval(order.paidDate, interval)) {
                    const dayKey = format(order.paidDate, 'yyyy-MM-dd');
                    dailyData.set(dayKey, (dailyData.get(dayKey) || 0) + order.amount);
                }
            });
        });

        const chartData = Array.from(dailyData.entries()).map(([date, revenue]) => ({ date, revenue })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return { totalRevenue, roomRevenue, serviceRevenue, adr, chartData, filterLabel };
    }, [checkoutHistory, dateRange, filterLabel, revenueFromPaidCorporateBills, corporateClients]);

    // Service Analytics Calculation
    const serviceAnalyticsData: ServiceAnalyticsData = useMemo(() => {
         if (!dateRange?.from) return { totalServiceRevenue: 0, mostRequestedService: null, topRevenueService: null, serviceAnalytics: [], categoryAnalytics: [], filterLabel };

        const interval = { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to || dateRange.from) };
        
        const servicesInRange = [
            ...checkoutHistory.filter(stay => isWithinInterval(new Date(stay.checkOutDate), interval)).flatMap(stay => stay.finalBill.serviceCharges),
            ...serviceRequests.filter(req => isWithinInterval(new Date(req.creationTime), interval))
        ];

        const analyticsMap = new Map<string, { requests: number, revenue: number, category: string }>();
        servicesInRange.forEach(service => {
            const serviceName = service.service.replace(/ \(x\d+\)$/, '').trim();
            const existing = analyticsMap.get(serviceName);

            let displayCategory = service.category || 'Other';
            if ((service as any).restaurantId) {
                const restaurant = restaurants.find(r => r.id === (service as any).restaurantId);
                if (restaurant) {
                    displayCategory = restaurant.name;
                }
            }

            if (existing) {
                analyticsMap.set(serviceName, {
                    ...existing,
                    requests: existing.requests + (service.quantity || 1),
                    revenue: existing.revenue + (service.price || 0),
                });
            } else {
                analyticsMap.set(serviceName, { requests: service.quantity || 1, revenue: service.price || 0, category: displayCategory });
            }
        });
        const serviceAnalytics = Array.from(analyticsMap.entries()).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.revenue - a.revenue);

        const categoryMap = new Map<string, number>();
        serviceAnalytics.forEach(service => {
            const category = service.category || 'Other';
            categoryMap.set(category, (categoryMap.get(category) || 0) + service.revenue);
        });

        const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8442ff", "#ff42c9", "#a4de6c", "#d0ed57", "#ffc658"];
        const categoryAnalytics = Array.from(categoryMap.entries())
            .map(([name, revenue], index) => ({ name, revenue, fill: COLORS[index % COLORS.length] }))
            .sort((a, b) => b.revenue - a.revenue);
        
        const userFacingServices = serviceAnalytics.filter(s => s.name !== 'Post-Checkout Cleaning');

        const mostRequestedService = [...userFacingServices].sort((a, b) => b.requests - a.requests)[0] || null;
        const topRevenueService = userFacingServices[0] || null;
        const totalServiceRevenue = serviceAnalytics.reduce((sum, service) => sum + service.revenue, 0);

        return { totalServiceRevenue, mostRequestedService, topRevenueService, serviceAnalytics, categoryAnalytics, filterLabel };
    }, [serviceRequests, checkoutHistory, dateRange, filterLabel, restaurants]);
    
    const occupancyAnalyticsData: OccupancyAnalyticsData = useMemo(() => {
        if (!dateRange?.from || !rooms) return { chartData: [], filterLabel };
        
        const interval = { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to || dateRange.from) };
        if (!interval.start || !interval.end) return { chartData: [], filterLabel };
        
        const daysInInterval = eachDayOfInterval(interval);

        const chartData = daysInInterval.map(day => {
            const calculationDate = startOfDay(day);
            const totalRooms = rooms.length;

            if (totalRooms === 0) {
                return { date: format(day, 'yyyy-MM-dd'), occupancy: 0 };
            }

            const occupiedCount = rooms.filter(room => {
                const isBooked = room.stays.some(stay => 
                    isWithinInterval(calculationDate, { start: startOfDay(new Date(stay.checkInDate)), end: subDays(startOfDay(new Date(stay.checkOutDate)), 1) })
                );
                const isOutOfOrder = (room.outOfOrderBlocks || []).some(block => 
                    isWithinInterval(calculationDate, { start: startOfDay(new Date(block.from)), end: startOfDay(new Date(block.to)) })
                );
                return isBooked || isOutOfOrder;
            }).length;

            const occupancyPercentage = totalRooms > 0 ? (occupiedCount / totalRooms) * 100 : 0;
            
            return { date: format(day, 'yyyy-MM-dd'), occupancy: occupancyPercentage };
        });

        return { chartData, filterLabel };
    }, [dateRange, rooms, filterLabel]);
    
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
                        Comprehensive performance overview for: <span className="font-semibold text-primary">{filterLabel}</span>
                    </p>
                </div>
                 <div className="flex items-center gap-2 pt-2 md:pt-0">
                    <Button variant="ghost" size="icon" className="size-8" onClick={() => handleMonthChange('prev')}>
                        <ChevronLeft className="size-4" />
                    </Button>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className={cn("w-full sm:w-[280px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {filterLabel}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
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

                    <Button variant="ghost" size="icon" className="size-8" onClick={() => handleMonthChange('next')}>
                        <ChevronRight className="size-4" />
                    </Button>
                    
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
