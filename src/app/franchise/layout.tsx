
'use client';
import React, { useEffect, Suspense } from 'react';
import { FranchiseSidebar } from '@/components/franchise/sidebar';
import { Header } from '@/components/common/header';
import { HotelIdProvider } from '@/context/hotel-id-context';
import { useUser, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { PageLoader } from '@/components/common/page-loader';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';


export default function FranchiseLayout({ 
  children,
}: { 
  children: React.ReactNode,
}) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login/franchise');
    }
    // Note: We are not checking the 'isFranchiseOwner' claim here on the client-side
    // as it's primarily used for server-side rule enforcement and initial login routing.
    // The backend security rules are the source of truth for access control.
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
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
              The application cannot connect to the Firestore database. Please ensure the database is provisioned in your Firebase project.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  // A dummy hotelId is used here as this layout is for multi-hotel views.
  // The header component is smart enough not to fetch data when it sees this dummy ID.
  const FRANCHISE_DUMMY_HOTEL_ID = "FRANCHISE_OWNER";

  return (
    <HotelIdProvider hotelId={FRANCHISE_DUMMY_HOTEL_ID}>
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <FranchiseSidebar />
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-16">
            <Header />
            <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            {children}
            </main>
        </div>
        </div>
    </HotelIdProvider>
  );
}
