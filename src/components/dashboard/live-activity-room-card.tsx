
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Room, Stay } from "@/lib/types";
import { User, Clock, FilePlus, List, FileText, Calendar, ShieldCheck, Moon, Users, Copy } from "lucide-react";
import { format, formatDistanceToNow, isValid, differenceInCalendarDays } from "date-fns";
import { useSettings } from "@/context/settings-context";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';

interface LiveActivityRoomCardProps {
  room: Room;
  balance: number;
  hasSlaBreach: boolean;
  onAddCharge: () => void;
  onViewLog: () => void;
  onGenerateBill: () => void;
  onManageStay: () => void;
  role?: 'admin' | 'manager';
}

export function LiveActivityRoomCard({ room, balance, hasSlaBreach, onAddCharge, onViewLog, onGenerateBill, onManageStay, role = 'admin' }: LiveActivityRoomCardProps) {
  const [stayDuration, setStayDuration] = useState<string | null>(null);
  const { formatPrice } = useSettings();
  const { toast } = useToast();
  
  const stay = room.stayId ? room.stays.find(s => s.stayId === room.stayId) : undefined;

  useEffect(() => {
    // This effect runs only on the client, after hydration
    const checkInDate = stay?.checkInDate ? new Date(stay.checkInDate) : null;
    if (checkInDate && isValid(checkInDate)) {
      setStayDuration(formatDistanceToNow(checkInDate, { addSuffix: true }));
    }
  }, [stay?.checkInDate]);
  
  const nights = (stay?.checkInDate && stay?.checkOutDate && isValid(new Date(stay.checkInDate)) && isValid(new Date(stay.checkOutDate)))
    ? differenceInCalendarDays(new Date(stay.checkOutDate), new Date(stay.checkInDate)) || 1
    : 0;

  const copyStayId = () => {
    if(!stay?.stayId) return;
    navigator.clipboard.writeText(stay.stayId);
    toast({
        title: "Stay ID Copied!",
        description: "The guest's Stay ID has been copied to your clipboard."
    })
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>Room {room.number}</CardTitle>
                <CardDescription>{room.type}</CardDescription>
            </div>
             <div className="flex flex-col items-end gap-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                    <User className="size-4" />
                    <span>{stay?.guestName}</span>
                </div>
                {stay?.stayId && (
                    <button onClick={copyStayId} className="flex items-center gap-1.5 cursor-pointer group">
                        <ShieldCheck className="size-3 text-muted-foreground/50 group-hover:text-primary transition-colors"/>
                        <span className="font-mono text-xs group-hover:text-primary transition-colors">{stay.stayId}</span>
                    </button>
                )}
                 {stay?.checkInDate && stay?.checkOutDate && isValid(new Date(stay.checkInDate)) && isValid(new Date(stay.checkOutDate)) && (
                    <div className="text-xs text-muted-foreground space-y-1 text-right">
                        <div className="flex items-center gap-2 justify-end">
                            <Calendar className="size-3" />
                            <span>{format(new Date(stay.checkInDate), 'MMM d')} - {format(new Date(stay.checkOutDate), 'MMM d')}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="size-4" />
            {stayDuration !== null ? <span>Checked in {stayDuration}</span> : <span>Loading...</span>}
        </div>
       
         <div className="flex flex-wrap items-center gap-2 pt-2">
            {nights > 0 && (
                <Badge variant="secondary">
                    <Moon className="mr-1.5 size-3" />
                    {nights} {nights === 1 ? 'night' : 'nights'}
                </Badge>
            )}
             {stay?.isGroupBooking && (
                <Badge variant="outline" className="border-purple-500/50 text-purple-600">
                    <Users className="mr-1.5 size-3" />
                    Group
                </Badge>
            )}
            {balance > 0 && (
                <Badge variant="destructive">Balance Due: {formatPrice(balance)}</Badge>
            )}
        </div>
      </CardContent>
      <CardFooter className="grid grid-cols-2 gap-2">
        {role === 'admin' ? (
          <>
            <Button variant="outline" onClick={onManageStay}>
                <Calendar className="mr-2" /> Manage Stay
            </Button>
            <Button variant="outline" onClick={onViewLog} className="relative">
                {hasSlaBreach && (
                  <span className="absolute top-1 right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                )}
                <List className="mr-2" /> View Log
            </Button>
          </>
        ) : (
          <div className="col-span-2" /> // Placeholder for manager to keep layout
        )}
         <Button variant="outline" onClick={onAddCharge}>
            <FilePlus className="mr-2" /> Add Charge
        </Button>
        {role === 'admin' ? (
            <Button className="" onClick={onGenerateBill}>
                <FileText className="mr-2" /> Billing
            </Button>
        ) : (
            <div />
        )}
      </CardFooter>
    </Card>
  );
}
