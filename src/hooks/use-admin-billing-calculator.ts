'use client';

import { useMemo } from 'react';
import { useRoomState } from '@/context/room-context';
import { useServices } from '@/context/service-context';
import { useSettings } from '@/context/settings-context';
import type { Stay, Room, ServiceRequest } from '@/lib/types';
import { differenceInCalendarDays } from 'date-fns';

/**
* A hook for calculating bill summaries from an admin perspective,
* with awareness of all rooms and service requests, including group bookings.
*/
export function useAdminBillingCalculator() {
    const { rooms } = useRoomState();
    const { serviceRequests } = useServices();
    const { gstRate, serviceChargeRate } = useSettings();

    const getBillSummary = (stay: Stay, room: Room) => {
        if (!stay || !room) {
            return { currentBalance: 0 };
        }

        let staysToBill: Stay[] = [stay];
        let serviceRequestsToBill: ServiceRequest[] = serviceRequests.filter(req => req.stayId === stay.stayId);

        // If it's a clubbed group booking, aggregate charges from all related rooms.
        if (stay.isGroupBooking && stay.groupMasterStayId) {
            const allGroupStays = rooms.flatMap(r => r.stays.filter(s => s.groupMasterStayId === stay.groupMasterStayId));
            staysToBill = allGroupStays;
            const allGroupStayIds = allGroupStays.map(s => s.stayId);
            serviceRequestsToBill = serviceRequests.filter(req => req.stayId && allGroupStayIds.includes(req.stayId));
        }
        
        const totalRoomCharge = staysToBill.reduce((total, s) => {
            const nights = differenceInCalendarDays(new Date(s.checkOutDate), new Date(s.checkInDate)) || 1;
            return total + (s.roomCharge * nights);
        }, 0);

        const totalServicesCharge = serviceRequestsToBill.reduce((sum, item) => sum + (item.price || 0), 0);
        
        const subtotal = totalRoomCharge + totalServicesCharge;
        const serviceChargeAmount = (subtotal * serviceChargeRate) / 100;
        const gstAmount = (subtotal * gstRate) / 100;
        const totalWithTaxes = subtotal + serviceChargeAmount + gstAmount;

        const totalPaidAmount = staysToBill.reduce((total, s) => total + (s.paidAmount || 0), 0);
        const currentBalance = totalWithTaxes - totalPaidAmount;

        return { currentBalance };
    };

    return { getBillSummary };
}
