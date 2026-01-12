
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Room, RoomStatus, ServiceTiming } from "./types";
import { startOfDay, isWithinInterval, isBefore, parse, set } from 'date-fns';


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const isToday = (someDate: Date) => {
    const today = new Date()
    return someDate.getDate() == today.getDate() &&
      someDate.getMonth() == today.getMonth() &&
      someDate.getFullYear() == today.getFullYear()
}


export const getRoomDisplayStatus = (room: Room, now: Date): RoomStatus => {
    const today = startOfDay(now);

    if (room.outOfOrderBlocks?.some(block => isWithinInterval(today, { start: startOfDay(new Date(block.from)), end: startOfDay(new Date(block.to)) }))) {
        return 'Out of Order';
    }

    const activeStay = room.stays?.find(stay => {
        if (!stay.checkInDate || !stay.checkOutDate) return false;
        const checkIn = startOfDay(new Date(stay.checkInDate));
        const checkOut = startOfDay(new Date(stay.checkOutDate));
        return stay.status === 'Checked In' && today >= checkIn && today < checkOut;
    });

    if (activeStay) {
        return 'Occupied';
    }
    
    if (room.checkOutDate && isToday(new Date(room.checkOutDate))) {
      return 'Cleaning';
    }

    const arrivalToday = room.stays?.find(stay => {
        if (!stay.checkInDate) return false;
        const checkIn = startOfDay(new Date(stay.checkInDate));
        return isToday(checkIn) && stay.status !== 'Checked In';
    });
    if (arrivalToday) {
        return 'Waiting for Check-in';
    }

    const hasFutureReservation = room.stays?.some(stay => {
        if (!stay.checkInDate) return false;
        const checkIn = startOfDay(new Date(stay.checkInDate));
        return isBefore(today, checkIn);
    });
    if (hasFutureReservation) {
        return 'Reserved';
    }
    
    return room.status;
}

export const isServiceAvailable = (serviceName: string, serviceTimings: ServiceTiming[], now: Date): boolean => {
    const timing = serviceTimings.find(t => t.name === serviceName);
    
    // If no specific timing is defined, assume it's always available.
    if (!timing) {
      return true;
    }
    
    // If it's explicitly disabled, it's not available.
    if (!timing.enabled) {
      return false;
    }
    
    // Check if the current time is within the service's operational hours.
    const startTime = parse(timing.startTime, 'HH:mm', now);
    const endTime = parse(timing.endTime, 'HH:mm', now);

    return isWithinInterval(now, { start: startTime, end: endTime });
};
