'use client';
import Link from 'next/link';
import {
  LayoutDashboard,
  Hotel,
  LogOut,
  Send,
} from 'lucide-react';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePathname, useRouter } from 'next/navigation';

export function FranchiseSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { href: `/franchise`, icon: LayoutDashboard, label: 'Portfolio Overview' },
    { href: `/franchise/request-access`, icon: Send, label: 'Request Access' },
  ];

  const handleLogout = () => {
    router.push('/?logout=true');
  };

  return (
    <aside className="group fixed inset-y-0 left-0 z-40 hidden w-16 flex-col border-r bg-background transition-all duration-300 ease-in-out hover:w-64 sm:flex">
        <div className="flex shrink-0 items-center justify-center px-2 sm:py-5">
            <Link
                href="/franchise"
                className="group/logo flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground"
            >
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Logo className="size-10" />
                </div>
                <span className="sr-only">Franchise Portal</span>
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
                                isActive && "group-hover:bg-primary/10 group-hover:text-primary bg-primary/10 text-primary"
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
