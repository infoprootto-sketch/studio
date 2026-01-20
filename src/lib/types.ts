

import { doc } from "firebase/firestore";

export type RoomStatus = 'Available' | 'Occupied' | 'Cleaning' | 'Out of Order' | 'Waiting for Check-in' | 'Reserved';

export interface Hotel {
  id: string;
  name: string;
  email: string;
  contactNumber: string;
  adminName: string;
  location: string;
  status: 'Active' | 'Disabled';
  plan: 'Boutique' | 'Business' | 'Enterprise';
  roomLimit: number;
  ownerUids: string[];
  teamSize?: number;
  adminCount?: number;
  managerCount?: number;
  receptionCount?: number;
  roomCount?: number;
}

export interface AccessRequest {
    id: string;
    requesterUid: string;
    requesterEmail: string;
    requestDate: Date;
}

export interface Stay {
  stayId: string;
  guestName: string;
  guestNumber?: string | null;
  checkInDate: Date;
  checkOutDate: Date;
  roomCharge: number;
  paidAmount?: number;
  isBilledToCompany?: boolean;
  status?: 'Booked' | 'Checked In' | 'Checked Out' | 'Master';
  isGroupBooking?: boolean;
  groupMasterStayId?: string;
  isPrimaryInGroup?: boolean;
  serviceRequestIds?: string[];
}

export interface Room {
  id: string;
  number: string;
  status: RoomStatus;
  displayStatus: RoomStatus;
  type: string; // This will be the name of the RoomCategory
  stays: Stay[];
  outOfOrderBlocks?: { from: Date; to: Date }[];
  // For simplicity, we can still keep a 'current' stay's info at the top level
  // This can represent the active or most recent stay details shown in some UIs
  guestName?: string;
  checkIn?: string; // Time of check-in
  checkInDate?: Date;
  checkOutDate?: Date; // This can now represent the date a room became dirty
  stayId?: string;
}


export interface RoomCategory {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  quickDiscounts?: number[];
  cleaningConsumables?: { itemId: string; quantity: number }[];
}

export type ServiceRequestStatus = 'Pending' | 'In Progress' | 'Completed';
export type ServiceCategory = {
    id: string;
    name: string;
    type: 'F&B' | 'Other';
    slaMinutes?: number;
};


export interface ServiceRequest {
  id: string;
  stayId?: string; // Optional for system-generated tasks like cleaning
  roomNumber: string;
  service: string;
  status: ServiceRequestStatus;
  time: string;
  creationTime: Date;
  completionTime?: Date;
  staff?: string; // Department name or Kitchen Name
  assignedTo?: string; // TeamMember ID
  createdBy?: string; // TeamMember ID of creator for manual charges
  isManualCharge?: boolean;
  price?: number;
  category?: string;
  serviceId?: string;
  quantity?: number;
  isEmergency?: boolean;
  notes?: string;
}

export interface Restaurant {
    id: string;
    name: string;
    categories?: string[];
    cuisineTags?: string[];
    imageUrl?: string;
    slaMinutes?: number;
}

export interface HotelService {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  price: number;
  discount?: number; // Percentage discount
  description?: string;
  restaurantId?: string;
  inventoryItemId?: string;
  inventoryQuantityConsumed?: number;
  dietaryType?: 'veg' | 'non-veg';
}

export type BilledOrderStatus = 'Pending' | 'Paid';

export interface BilledOrder {
    id: string;
    stayId: string;
    guestName: string;
    roomNumber: string;
    amount: number;
    status: BilledOrderStatus;
    date: Date;
    paidDate?: Date | null;
}
export interface CorporateClient {
  id: string;
  name: string;
  address: string;
  contactPerson: string;
  gstNumber: string;
  billedOrders?: BilledOrder[];
}

export interface FinalBill {
    roomCharges: { label: string; amount: number };
    serviceCharges: ServiceRequest[];
    subtotal: number;
    serviceChargeAmount: number;
    gstAmount: number;
    paidAmount: number;
    discount: number;
    total: number;
    paymentMethod: string;
}

export interface CheckedOutStay {
    stayId: string;
    roomNumber: string;
    roomType: string;
    guestName: string;
    checkInDate: Date;
    checkOutDate: Date;
    finalBill: FinalBill;
}

export type TeamDepartment = 'Reception' | 'F&B' | 'Housekeeping' | 'Spa' | 'Gym' | string; // Allow custom strings
export type TeamRole = 'Admin' | 'Manager' | 'Reception' | 'Member';
export type AttendanceStatus = 'Clocked In' | 'Clocked Out';

export interface Shift {
    id: string;
    name: string;
    startTime: string; // "HH:mm"
    endTime: string; // "HH:mm"
}

export interface AttendanceRecord {
    date: Date;
    clockIn: Date;
    clockOut: Date | null;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  department: TeamDepartment;
  role: TeamRole;
  shiftId: string;
  attendanceStatus: AttendanceStatus;
  lastClockIn?: Date;
  attendanceHistory?: AttendanceRecord[];
  restaurantId?: string;
  createdByAdmin?: string;
}

export interface Department {
    id: string;
    name: TeamDepartment;
    manages: string[];
}

export interface SlaRule {
  id: string;
  serviceName: string;
  timeLimitMinutes: number;
}

export interface ServiceTiming {
  id: string;
  name: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

export interface Vendor {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  category?: string;
}


export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  parLevel: number;
  unit: string;
}

export interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  type: 'Restock' | 'Consumption' | 'Adjustment';
  quantity: number;
  date: Date;
  notes?: string;
}

export interface HotelSettings {
  country: string;
  currency: string;
  language: string;
  legalName: string;
  address: string;
  gstNumber: string;
  gstRate: number;
  serviceChargeRate: number;
  wifiSSID: string;
  wifiPassword: string;
}

export interface Broadcast {
    id: string;
    title: string;
    message: string;
    status: 'Draft' | 'Active' | 'Inactive' | 'Archived';
    type: 'One-time' | 'Recurring';
    // For One-time
    startDate?: Date;
    endDate?: Date;
    // For Recurring
    startTime?: string;
    endTime?: string;
    daysOfWeek?: number[]; // 0 for Sunday, 1 for Monday, etc.
    targetRoomCategories: string[]; // List of RoomCategory names
    displayFrequency: 'always-visible' | 'once-per-session' | 'once-per-hour' | 'once-per-day';
}

export interface ActiveStay {
    hotelId: string;
    roomNumber: string;
    roomId: string;
}
