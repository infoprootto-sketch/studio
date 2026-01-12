
'use client';
import Link from 'next/link';
import {
  Activity,
  Settings,
  LogIn,
  LogOut,
  Home,
  Users,
  History,
  LineChart,
} from 'lucide-react';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useHotelId } from '@/context/hotel-id-context';
import { useTeam } from '@/context/team-context';
import { usePathname } from 'next/navigation';
import { useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';


export function AppSidebar() {
  const { teamMembers } = useTeam();
  const { toast } = useToast();
  const hotelId = useHotelId();
  const pathname = usePathname();
  const { user } = useUser();
  const router = useRouter();


  // In a real app, this would come from an auth context
  // This simulation assumes a single user for the prototype
  const currentUser = user ? teamMembers.find(m => m.id === user.uid) : null;

  const managerNavItems = [
    { href: `/${hotelId}/team/dashboard`, icon: Home, label: 'Dashboard' },
    { href: `/${hotelId}/team/team`, icon: Users, label: 'Team' },
    { href: `/${hotelId}/team/checkout-history`, icon: History, label: 'Checkout History' },
    { href: `/${hotelId}/team/revenue-analytics`, icon: LineChart, label: 'Revenue Analytics' },
  ];

  const memberNavItems = [
    { href: `/${hotelId}/team/dashboard`, icon: Home, label: 'Dashboard' },
  ];
  
  const navItems = currentUser?.role === 'Manager' ? managerNavItems : memberNavItems;

  const handleLogout = () => {
    router.push('/?logout=true');
  };

  return (
    <aside className="group fixed inset-y-0 left-0 z-40 hidden w-16 flex-col border-r bg-background transition-all duration-300 ease-in-out hover:w-64 sm:flex">
        <div className="flex shrink-0 items-center justify-center px-2 sm:py-5">
            <Link
            href={`/${hotelId}/team/dashboard`}
            className="group/logo flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground"
            >
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Logo className="size-10" />
            </div>
            <span className="sr-only">StayCentral Team</span>
            </Link>
        </div>
        <nav className="flex flex-1 flex-col items-center gap-4 px-2 overflow-hidden">
            <ScrollArea className="w-full">
                <div className="flex flex-col items-center gap-4 py-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={cn(
                                "flex h-12 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground group-hover:w-full group-hover:justify-start group-hover:px-3 hover:bg-muted",
                                isActive && "group-hover:bg-primary/10 group-hover:text-primary"
                            )}
                        >
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                                <item.icon className="h-6 w-6 shrink-0" />
                            </div>
                            <span className="ml-2 whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100 font-bold">{item.label}</span>
                            <span className="sr-only">{item.label}</span>
                        </Link>
                    )})}
                </div>
            </ScrollArea>
        </nav>
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
            <button
                onClick={handleLogout}
                className={cn(
                    "flex h-12 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground group-hover:w-full group-hover:justify-start group-hover:px-3 hover:bg-muted"
                )}
            >
                 <div className="flex h-12 w-12 shrink-0 items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                    <LogOut className="h-6 w-6 shrink-0" />
                </div>
                <span className="ml-2 whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100 font-bold">Logout</span>
                <span className="sr-only">Logout</span>
            </button>
        </nav>
    </aside>
  );
}
