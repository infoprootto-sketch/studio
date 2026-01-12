
import { Shirt, Wrench, Sparkles, ConciergeBell, Utensils, Car, Dumbbell, Droplets, Briefcase } from "lucide-react";
import type { ElementType } from "react";

export const IconMapping: Record<string, ElementType> = {
    "Laundry": Shirt,
    "Maintenance": Wrench,
    "Room Amenity": Sparkles,
    "SPA": ConciergeBell,
    "In-Room Dining": Utensils,
    "Transportation Service": Car,
    "GYM": Dumbbell,
    "Swimming Pool": Droplets,
    "Business & Corporate Services": Briefcase,
    "Housekeeping Services": Droplets,
    // Add other mappings here as needed
};
