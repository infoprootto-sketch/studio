
'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { PageLoader } from '@/components/common/page-loader';
import { AppSidebar } from '@/components/common/sidebar';
import { Header } from '@/components/common/header';
import { HotelIdProvider } from '@/context/hotel-id-context';
import { RoomProvider } from '@/context/room-context';
import { ServiceProvider } from '@/context/service-context';
import { TeamProvider } from '@/context/team-context';
import { BillingProvider } from '@/context/billing-context';
import { InventoryProvider } from '@/context/inventory-context';
import { SettingsProvider } from '@/context/settings-context';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function DashboardLayout({ 
  children, 
  params 
}: { 
  children: React.ReactNode,
  params: { hotelId: string }
}) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      // Redirect to the main login page if not authenticated
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    // Show a loader while checking auth status or if there's no user
    // This prevents a flash of the dashboard content
    return (
      <Suspense fallback={null}>
        <PageLoader />
      </Suspense>
    );
  }

  if (!firestore) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Database Not Connected</CardTitle>
            <CardDescription>
              The application cannot connect to the Firestore database. Please ensure the database is provisioned in your Firebase project and that the project configuration is correct.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // If authenticated, render the full dashboard layout with all providers
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
