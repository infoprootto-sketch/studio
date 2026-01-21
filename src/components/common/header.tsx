
'use client';
import Link from 'next/link';
import {
  Home,
  BedDouble,
  ConciergeBell,
  Users,
  CreditCard,
  LineChart,
  Hotel,
  QrCode,
  PanelLeft,
  Settings,
  Activity,
  History,
  Clipboard,
  Bell,
  AlertTriangle,
  Clock,
  LogOut,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useHotelId } from '@/context/hotel-id-context';
import { useMemo, useState, useEffect, useRef } from 'react';
import { differenceInMinutes, formatDistanceToNow } from 'date-fns';
import { Separator } from '../ui/separator';
import { useServices } from '@/context/service-context';
import { useTeam } from '@/context/team-context';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { ThemeToggle } from '../theme-toggle';

export function Header() {
  const hotelId = useHotelId();
  const auth = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const { toast } = useToast();
  const isSuperAdminView = hotelId === "SUPER_ADMIN";

  let servicesContext, teamContext;
  
  if (!isSuperAdminView) {
    try {
      servicesContext = useServices();
      teamContext = useTeam();
    } catch (error) {
        // This can happen if the component is rendered outside the providers.
        // We'll proceed without notification data.
        servicesContext = undefined;
        teamContext = undefined;
    }
  }

  const serviceRequests = servicesContext?.serviceRequests;
  const slaRules = teamContext?.slaRules;

  const [currentTime, setCurrentTime] = useState(new Date());
  const prevEmergencyCount = useRef(0);

  useEffect(() => {
    // Update current time every 30 seconds to re-evaluate SLA breaches
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const notifications = useMemo(() => {
    if (isSuperAdminView || !serviceRequests || !slaRules) return [];
    
    const alerts: any[] = [];

    // Check for emergencies first
    serviceRequests.forEach(req => {
        if (req.isEmergency && req.status === 'Pending') {
            alerts.push({
                id: `sos-${req.id}`,
                type: 'sos',
                message: `SOS: ${req.service.replace('SOS: ', '')}`,
                details: `Room ${req.roomNumber} triggered an emergency alert.`,
                time: formatDistanceToNow(new Date(req.creationTime), { addSuffix: true })
            });
        }
    });

    // Check for SLA breaches
    serviceRequests.forEach(req => {
        if (!req.isEmergency && (req.status === 'Pending' || req.status === 'In Progress')) {
            const rule = slaRules.find(r => r.serviceName === req.category);
            if (rule) {
                const timeElapsed = differenceInMinutes(currentTime, new Date(req.creationTime));
                if (timeElapsed > rule.timeLimitMinutes) {
                    alerts.push({
                        id: `sla-${req.id}`,
                        type: 'sla',
                        message: `SLA Breach: Room ${req.roomNumber}`,
                        details: `"${req.service}" is overdue by ${timeElapsed - rule.timeLimitMinutes} mins.`,
                        time: formatDistanceToNow(new Date(req.creationTime), { addSuffix: true })
                    });
                }
            }
        }
    });

    return alerts;
  }, [isSuperAdminView, serviceRequests, slaRules, currentTime]);
  
  const emergencyCount = useMemo(() => notifications.filter(n => n.type === 'sos').length, [notifications]);

  useEffect(() => {
    // This effect should only run on the client side
    if (typeof window !== 'undefined' && !isSuperAdminView) {
        if (emergencyCount > prevEmergencyCount.current) {
            const newEmergency = notifications.find(n => n.type === 'sos'); // Find one of the new ones
            if (newEmergency) {
                toast({
                    variant: "destructive",
                    title: newEmergency.message,
                    description: newEmergency.details,
                    duration: 20000,
                });
            }
        }
        prevEmergencyCount.current = emergencyCount;
    }
  }, [emergencyCount, notifications, toast, isSuperAdminView]);

  const handleCopyId = () => {
    if(!hotelId) return;
    navigator.clipboard.writeText(hotelId);
    toast({
      title: 'Hotel ID Copied!',
      description: 'The Hotel ID has been copied to your clipboard.',
    });
  };

  const handleLogout = () => {
    router.push('/?logout=true');
  }

  const mobileNavItems = [
    { href: `/${hotelId}/dashboard`, icon: Home, label: 'Dashboard' },
    { href: `/${hotelId}/dashboard/live-activity`, icon: Activity, label: 'Live Activity' },
    { href: `/${hotelId}/dashboard/rooms`, icon: BedDouble, label: 'Rooms' },
    { href: `/${hotelId}/dashboard/services`, icon: ConciergeBell, label: 'Services' },
    { href: `/${hotelId}/dashboard/team`, icon: Users, label: 'Team' },
    { href: `/${hotelId}/dashboard/billing`, icon: CreditCard, label: 'Corporate Clients' },
    { href: `/${hotelId}/dashboard/checkout-history`, icon: History, label: 'Checkout History' },
    { href: `/${hotelId}/dashboard/revenue-analytics`, icon: LineChart, label: 'Revenue Analytics' },
    { href: `/${hotelId}/dashboard/settings`, icon: Settings, label: 'Settings' },
  ];

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              href={`/${hotelId}/dashboard`}
              className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
            >
              <Hotel className="h-5 w-5 transition-all group-hover:scale-110" />
              <span className="sr-only">StayCentral</span>
            </Link>
            {mobileNavItems.map((item) => (
                <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      <div className="flex-1 hidden md:flex items-center gap-2">
        {hotelId && !isSuperAdminView && (
          <>
            <Badge variant="outline">Hotel ID: {hotelId}</Badge>
            <Button variant="ghost" size="icon" onClick={handleCopyId}>
              <Clipboard className="h-4 w-4" />
              <span className="sr-only">Copy Hotel ID</span>
            </Button>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
      {!isSuperAdminView && (
       <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className="relative overflow-visible rounded-full"
                >
                    <Bell className="h-4 w-4" />
                    {notifications.length > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${emergencyCount > 0 ? 'bg-red-400' : 'bg-yellow-400'} opacity-75`}></span>
                            <span className={`relative inline-flex rounded-full h-3 w-3 ${emergencyCount > 0 ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.map((notification: any, index: number) => (
                    <DropdownMenuItem key={notification.id} className="flex-col items-start gap-1">
                        <div className="flex items-center font-semibold">
                           {notification.type === 'sos' && <AlertTriangle className="mr-2 h-4 w-4 text-destructive" />}
                           {notification.type === 'sla' && <Clock className="mr-2 h-4 w-4 text-yellow-500" />}
                           {notification.message}
                        </div>
                        <p className="text-xs text-muted-foreground">{notification.details}</p>
                        <p className="text-xs text-muted-foreground/70 self-end">{notification.time}</p>
                        {index < notifications.length - 1 && <Separator className="w-full my-1"/>}
                    </DropdownMenuItem>
                ))}
                {notifications.length === 0 && (
                    <p className="p-4 text-center text-sm text-muted-foreground">No new notifications</p>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
      )}

        <ThemeToggle />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="overflow-hidden rounded-full">
            <Image
              src={user?.photoURL || "https://picsum.photos/seed/1/36/36"}
              width={36}
              height={36}
              alt="Avatar"
              className="overflow-hidden"
              data-ai-hint="person face"
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{user?.email || 'My Account'}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {!isSuperAdminView && <DropdownMenuItem asChild><Link href={`/${hotelId}/dashboard/settings`}>Settings</Link></DropdownMenuItem>}
          <DropdownMenuItem asChild><a href="mailto:support@staycentral.app">Support</a></DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
            </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    </header>
  );
}
