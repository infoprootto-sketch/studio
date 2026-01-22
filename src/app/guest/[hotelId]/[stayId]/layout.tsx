
'use client';
import { BottomNav } from "@/components/guest/bottom-nav";
import { Cart } from "@/components/guest/cart";
import { GuestHeader } from "@/components/guest/guest-header";
import { HotelIdProvider } from "@/context/hotel-id-context";
import { ServiceProvider } from "@/context/service-context";
import { SettingsProvider } from "@/context/settings-context";
import { StayProvider } from "@/context/stay-context";
import { usePathname, useParams } from 'next/navigation';
import React from 'react';
import { InventoryProvider } from "@/context/inventory-context";
import { BroadcastBanner } from "@/components/guest/broadcast-banner";
import { useFirestore } from "@/firebase";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams();
  const stayId = params.stayId as string;
  const hotelId = params.hotelId as string;
  const firestore = useFirestore();
  
  const isHomePage = pathname === `/guest/${hotelId}/${stayId}/`;

  if (!firestore) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Services Unavailable</CardTitle>
            <CardDescription>
              The hotel's digital services are temporarily unavailable. Please contact the front desk for assistance.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <HotelIdProvider hotelId={hotelId}>
      <SettingsProvider>
        <ServiceProvider>
          <InventoryProvider>
            <StayProvider stayId={stayId}>
              <div className="min-h-screen bg-background text-foreground flex flex-col">
                <BroadcastBanner />
                {!isHomePage && <GuestHeader />}
                <main className="flex-1 container mx-auto p-4 md:p-8 mb-20">
                  {children}
                </main>
                <Cart />
                <BottomNav />
              </div>
            </StayProvider>
          </InventoryProvider>
        </ServiceProvider>
      </SettingsProvider>
    </HotelIdProvider>
  );
}
