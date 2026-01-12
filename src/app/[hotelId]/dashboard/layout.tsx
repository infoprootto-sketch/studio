
import React from 'react';
import { AppSidebar } from '@/components/common/sidebar';
import { Header } from '@/components/common/header';
import { HotelIdProvider } from '@/context/hotel-id-context';
import { RoomProvider } from '@/context/room-context';
import { ServiceProvider } from '@/context/service-context';
import { TeamProvider } from '@/context/team-context';
import { BillingProvider } from '@/context/billing-context';
import { InventoryProvider } from '@/context/inventory-context';
import { SettingsProvider } from '@/context/settings-context';

export default function DashboardLayout({ 
  children, 
  params 
}: { 
  children: React.ReactNode,
  params: { hotelId: string }
}) {
  return (
    <HotelIdProvider hotelId={params.hotelId}>
      <SettingsProvider>
        <TeamProvider>
          <ServiceProvider>
            <InventoryProvider>
              <BillingProvider>
                <RoomProvider>
                  <div className="flex min-h-screen w-full flex-col bg-muted/40">
                    <AppSidebar />
                    <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-16">
                      <Header />
                      <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                        {children}
                      </main>
                    </div>
                  </div>
                </RoomProvider>
              </BillingProvider>
            </InventoryProvider>
          </ServiceProvider>
        </TeamProvider>
      </SettingsProvider>
    </HotelIdProvider>
  );
}
