'use client';
import React, { useEffect, Suspense } from 'react';
import { SuperAdminSidebar } from '@/components/super-admin/sidebar';
import { Header } from '@/components/common/header';
import { HotelIdProvider } from '@/context/hotel-id-context';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { PageLoader } from '@/components/common/page-loader';
import { SettingsProvider } from '@/context/settings-context';
import { InventoryProvider } from '@/context/inventory-context';
import { ServiceProvider } from '@/context/service-context';
import { TeamProvider } from '@/context/team-context';
import { BillingProvider } from '@/context/billing-context';
import { RoomProvider } from '@/context/room-context';

export default function SuperAdminLayout({ 
  children,
}: { 
  children: React.ReactNode,
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login/super-admin');
      return;
    }
    if (!isUserLoading && user) {
      user.getIdTokenResult().then(idTokenResult => {
        if (!idTokenResult.claims.isSuperAdmin) {
          router.push('/login');
        }
      });
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <Suspense fallback={null}>
        <PageLoader />
      </Suspense>
    );
  }
  
  const SUPER_ADMIN_DUMMY_HOTEL_ID = "SUPER_ADMIN";

  return (
    <HotelIdProvider hotelId={SUPER_ADMIN_DUMMY_HOTEL_ID}>
        <SettingsProvider>
          <TeamProvider>
            <ServiceProvider>
              <InventoryProvider>
                <BillingProvider>
                  <RoomProvider>
                    <div className="flex min-h-screen w-full flex-col bg-muted/40">
                        <SuperAdminSidebar />
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
