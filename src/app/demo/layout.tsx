
'use client';

import React from 'react';
import { DemoRoomProvider, DemoServiceProvider, DemoTeamProvider, DemoBillingProvider } from '@/context/demo/demo-providers';
import { HotelIdProvider } from '@/context/hotel-id-context';
import { AppSidebar } from '@/components/common/sidebar';
import { Header } from '@/components/common/header';
import { SettingsProvider } from '@/context/settings-context';
import { InventoryProvider } from '@/context/inventory-context';


export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const MOCK_HOTEL_ID = "DEMO_HOTEL";

  return (
      <HotelIdProvider hotelId={MOCK_HOTEL_ID}>
        <SettingsProvider>
          <DemoTeamProvider>
            <DemoServiceProvider>
              <InventoryProvider>
                <DemoBillingProvider>
                  <DemoRoomProvider>
                      <div className="flex min-h-screen w-full flex-col bg-muted/40">
                        <AppSidebar />
                        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-16">
                          <Header />
                          <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 relative">
                            {children}
                          </main>
                        </div>
                      </div>
                  </DemoRoomProvider>
                </DemoBillingProvider>
              </InventoryProvider>
            </DemoServiceProvider>
          </DemoTeamProvider>
        </SettingsProvider>
      </HotelIdProvider>
  );
}
