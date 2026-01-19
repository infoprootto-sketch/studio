'use client';
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Utensils, Map, ConciergeBell, Wifi, KeyRound, ShieldCheck, Moon, Copy, Clock, IndianRupee } from "lucide-react";
import { useStay } from "@/context/stay-context";
import { useServices } from "@/context/service-context";
import { useHotelId } from "@/context/hotel-id-context";
import { isServiceAvailable } from "@/lib/utils";
import { differenceInCalendarDays } from "date-fns";
import { useSettings } from "@/context/settings-context";
import { useToast } from "@/hooks/use-toast";
import { Button } from "../ui/button";
import { IconMapping } from "@/lib/icon-mapping";
import { useMemo, useState, useEffect } from "react";
import { GuestServiceTimingsDialog } from "./service-timings-dialog";


export function ServiceHub() {
    const { stay, room, billSummary } = useStay();
    const { serviceTimings, serviceCategories, restaurants } = useServices();
    const { wifiSSID, wifiPassword, formatPrice } = useSettings();
    const { toast } = useToast();
    const hotelId = useHotelId();
    const [isClient, setIsClient] = useState(false);
    const [isTimingsOpen, setIsTimingsOpen] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);
    
    const nights = (stay?.checkInDate && stay?.checkOutDate)
    ? differenceInCalendarDays(new Date(stay.checkOutDate), new Date(stay.checkInDate)) || 1
    : 0;
    
    const copyToClipboard = (text: string, label: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast({
            title: `${label} Copied!`,
            description: `${text} has been copied to your clipboard.`,
        });
    }

    const availableServices = useMemo(() => {
        const services = [];
        const now = new Date();

        // Add In-Room Dining if restaurants exist
        if (restaurants.length > 0) {
            services.push({
                name: "In-Room Dining",
                icon: Utensils,
                href: `/guest/${hotelId}/${stay?.stayId}/order`,
                isAvailable: isClient ? isServiceAvailable('In-Room Dining', serviceTimings, now) : true,
            });
        }

        // Add other service categories
        serviceCategories
            .filter(sc => sc.type === 'Other')
            .forEach(sc => {
                const categorySlug = sc.name.toLowerCase().replace(/\s+/g, '-');
                services.push({
                    name: sc.name,
                    icon: IconMapping[sc.name] || ConciergeBell,
                    href: `/guest/${hotelId}/${stay?.stayId}/service/${categorySlug}`,
                    isAvailable: isClient ? isServiceAvailable(sc.name, serviceTimings, now) : true,
                });
            });

        return services;
    }, [restaurants, serviceCategories, serviceTimings, hotelId, stay?.stayId, isClient]);

    return (
        <div className="space-y-8">
            <div className="mb-8">
                <p className="text-muted-foreground text-lg">Welcome{stay?.guestName ? `, ${stay.guestName}` : ''}</p>
                <h1 className="text-4xl font-bold font-headline">How can we help you?</h1>

                 <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <KeyRound className="size-5 text-primary"/>
                        <div>
                            <span className="font-semibold">Room No:</span> {room?.number || 'N/A'}
                        </div>
                    </div>
                     <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <Wifi className="size-5 text-primary"/>
                         <div>
                            <span className="font-semibold">Wi-Fi:</span> {wifiSSID || 'N/A'}
                        </div>
                    </div>
                     <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <ShieldCheck className="size-5 text-primary"/>
                         <div className="flex-1">
                            <span className="font-semibold">Wi-Fi Password:</span> {wifiPassword || 'N/A'}
                        </div>
                        {wifiPassword && (
                            <Button variant="ghost" size="icon" className="size-6" onClick={() => copyToClipboard(wifiPassword, "Password")}>
                                <Copy className="size-4" />
                            </Button>
                        )}
                    </div>
                     {stay?.stayId && (
                         <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                            <ShieldCheck className="size-5 text-primary"/>
                             <div className="flex-1">
                                <span className="font-semibold">Stay ID:</span> {stay.stayId}
                            </div>
                             <Button variant="ghost" size="icon" className="size-6" onClick={() => copyToClipboard(stay.stayId, "Stay ID")}>
                                <Copy className="size-4" />
                            </Button>
                        </div>
                     )}
                     {nights > 0 && (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                            <Moon className="size-5 text-primary"/>
                            <div>
                                <span className="font-semibold">Duration:</span> {nights} {nights === 1 ? 'night' : 'nights'}
                            </div>
                        </div>
                     )}
                     {billSummary && (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                            <IndianRupee className="size-5 text-primary"/>
                            <div>
                                <span className="font-semibold">Current Bill:</span> {formatPrice(billSummary.currentBalance)}
                            </div>
                        </div>
                     )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                 {availableServices.map((service) => {
                    const Icon = service.icon;
                    const href = service.isAvailable ? service.href : '#';
                    return (
                        <Link href={href} key={service.name} className={`group ${!service.isAvailable ? 'pointer-events-none' : ''}`} aria-disabled={!service.isAvailable}>
                           <Card className={`hover:bg-primary/5 hover:border-primary transition-all h-full ${!service.isAvailable ? 'bg-muted/50 opacity-50' : ''}`}>
                                <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
                                    <div className="bg-primary/10 text-primary p-3 rounded-lg">
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <p className="font-semibold">{service.name}</p>
                                    {!service.isAvailable && isClient && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Clock className="size-3"/>
                                            <span>Unavailable</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
            </div>

            <Link href={`/guest/${hotelId}/${stay?.stayId}/explore`} className="block group">
                 <Card className="hover:bg-primary/5 hover:border-primary transition-all">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="bg-primary/10 text-primary p-3 rounded-lg">
                            <Map className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="font-semibold text-lg">Explore The Local Area</p>
                            <p className="text-sm text-muted-foreground">AI-powered recommendations for food, sights, and more.</p>
                        </div>
                    </CardContent>
                </Card>
            </Link>
            
             <Card onClick={() => setIsTimingsOpen(true)} className="cursor-pointer hover:bg-primary/5 hover:border-primary transition-all">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="bg-primary/10 text-primary p-3 rounded-lg">
                        <Clock className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="font-semibold text-lg">Service Timings</p>
                        <p className="text-sm text-muted-foreground">View operational hours for our services.</p>
                    </div>
                </CardContent>
            </Card>

            <GuestServiceTimingsDialog isOpen={isTimingsOpen} onClose={() => setIsTimingsOpen(false)} />
        </div>
    )
}
