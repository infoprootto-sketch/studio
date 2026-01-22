
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Room, RoomStatus, ServiceTiming, Department, Restaurant, HotelService } from "./types";
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


/**
 * Determines the correct department for a service request based on routing rules.
 * @param departments The list of all available departments.
 * @param category The category of the service requested.
 * @param restaurants The list of all restaurants.
 * @param service The full service object.
 * @returns The name of the department responsible for the request.
 */
export const findDepartmentForCategory = (
    departments: Department[],
    category: string | undefined,
    restaurants: Restaurant[],
    service: HotelService | undefined
): string => {
    if (!category) return 'Reception';

    // 1. Direct match for the service category (e.g., "Laundry")
    const directDept = departments.find(d => d.manages.includes(category));
    if (directDept) return directDept.name;

    // 2. If it's an F&B item, find which department manages the parent restaurant
    if (service?.restaurantId) {
        const parentRestaurant = restaurants.find(r => r.id === service.restaurantId);
        if (parentRestaurant) {
            const restaurantDept = departments.find(d => d.manages.includes(parentRestaurant.name));
            if (restaurantDept) return restaurantDept.name;
        }
    }
    
    // 3. Fallback to a generic "F&B" department if it's an F&B item but no specific restaurant is assigned
     if (category.startsWith('F&B:')) {
        const fbDept = departments.find(d => d.manages.includes('F&B'));
        if (fbDept) return fbDept.name;
    }

    // 4. Default fallback
    return 'Reception';
}
