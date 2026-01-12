
'use client'

import Link from "next/link";
import { usePathname, useParams } from 'next/navigation';
import { Home, Utensils, Map, FileText, AlertTriangle, Clock, History, Siren, Shield, Flame, HeartPulse } from 'lucide-react';
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import { useStay } from "@/context/stay-context";
import { useState } from "react";
import { GuestServiceTimingsDialog } from "./service-timings-dialog";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import type { ServiceRequest } from "@/lib/types";


export function BottomNav() {
    const pathname = usePathname();
    const params = useParams();
    const { toast } = useToast();
    const { room, stay, addServiceRequests } = useStay();
    const [isTimingsOpen, setIsTimingsOpen] = useState(false);
    const [emergencyType, setEmergencyType] = useState<string>('');
    const [otherDetails, setOtherDetails] = useState('');
    const hotelId = params.hotelId as string;

    const navItems = [
        { href: `/guest/${hotelId}/${stay?.stayId}`, label: 'Home', icon: Home, exact: true },
        { href: `/guest/${hotelId}/${stay?.stayId}/order`, label: 'Order', icon: Utensils },
        { href: `/guest/${hotelId}/${stay?.stayId}/requests`, label: 'Requests', icon: History },
        { href: `/guest/${hotelId}/${stay?.stayId}/explore`, label: 'Explore', icon: Map },
        { href: `/guest/${hotelId}/${stay?.stayId}/bill`, label: 'Bill', icon: FileText },
    ];

    const emergencyOptions = [
        { id: 'medical', label: 'Medical Emergency', icon: HeartPulse },
        { id: 'fire', label: 'Fire Alert', icon: Flame },
        { id: 'security', label: 'Security Threat', icon: Shield },
        { id: 'other', label: 'Other Urgent Issue', icon: Siren },
    ];

    const handleEmergency = () => {
        if (!emergencyType) {
            toast({
                variant: 'destructive',
                title: 'Please select an emergency type.',
            });
            return;
        }

        if (!room || !stay) return;

        const emergencyDetails = emergencyType === 'other' ? `Other: ${otherDetails}` : emergencyType;
        const serviceDescription = `SOS: ${emergencyDetails}`;
        
        const newRequest: Omit<ServiceRequest, 'id'> = {
            stayId: stay.stayId,
            roomNumber: room.number,
            service: serviceDescription,
            status: 'Pending',
            time: 'Just now',
            creationTime: new Date(),
            staff: 'Reception', // Emergency requests are routed to reception/security
            price: 0,
            category: 'Emergency',
            isEmergency: true,
        };

        addServiceRequests([newRequest]);
        
        toast({
            variant: "destructive",
            title: `Emergency Alert Sent: ${emergencyType}`,
            description: `Staff has been notified of a ${emergencyDetails} issue in Room ${room?.number} and are on their way.`,
            duration: 10000,
        });

        // Reset state after sending
        setEmergencyType('');
        setOtherDetails('');
    }

    return (
        <>
            <AlertDialog>
                <div className="fixed bottom-0 left-0 right-0 bg-background border-t z-50">
                    <div className="container mx-auto h-20 px-4">
                        <div className="grid grid-cols-7 items-center h-full">
                            {navItems.map((item) => {
                                if (!item.href || !stay?.stayId) return <div key={item.label} />;
                                const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);

                                return (
                                    <Link href={item.href} key={item.label} className={cn(
                                        "flex flex-col items-center justify-center gap-1 transition-colors",
                                        isActive ? "text-primary" : "text-muted-foreground hover:text-primary"
                                    )}>
                                        <item.icon className="h-6 w-6" />
                                        <span className="text-xs font-medium">{item.label}</span>
                                    </Link>
                                );
                            })}
                            <button onClick={() => setIsTimingsOpen(true)} className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary">
                                <Clock className="h-6 w-6" />
                                <span className="text-xs font-medium">Timings</span>
                            </button>
                            <AlertDialogTrigger asChild>
                                <button className="flex flex-col items-center justify-center gap-1 text-destructive animate-pulse">
                                    <AlertTriangle className="h-6 w-6" />
                                    <span className="text-xs font-medium">SOS</span>
                                </button>
                            </AlertDialogTrigger>
                        </div>
                    </div>
                </div>

                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive"/>Confirm Emergency</AlertDialogTitle>
                    <AlertDialogDescription>
                        Please select the type of emergency in Room <span className="font-bold">{room?.number}</span>. This will immediately alert hotel staff.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <RadioGroup value={emergencyType} onValueChange={setEmergencyType} className="space-y-2">
                        {emergencyOptions.map(option => (
                             <Label key={option.id} htmlFor={option.id} className="flex items-center gap-3 p-3 border rounded-md has-[:checked]:bg-muted has-[:checked]:border-primary transition-all">
                                <RadioGroupItem value={option.label} id={option.id} />
                                <option.icon className="size-5 text-muted-foreground" />
                                {option.label}
                            </Label>
                        ))}
                    </RadioGroup>
                    {emergencyType.includes('Other') && (
                        <Textarea 
                            placeholder="Please describe the issue..."
                            value={otherDetails}
                            onChange={(e) => setOtherDetails(e.target.value)}
                        />
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleEmergency} disabled={!emergencyType}>Confirm Emergency</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <GuestServiceTimingsDialog isOpen={isTimingsOpen} onClose={() => setIsTimingsOpen(false)} />
        </>
    );
}
