'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CheckoutHistoryList } from '@/components/dashboard/checkout-history-list';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { useHotelId } from '@/context/hotel-id-context';
import { collection } from 'firebase/firestore';
import type { CheckedOutStay } from '@/lib/types';
import { PageLoader } from '@/components/common/page-loader';
import { useMemo } from 'react';

export default function CheckoutHistoryPage() {
    const firestore = useFirestore();
    const hotelId = useHotelId();
    const { user, isUserLoading } = useUser();
    
    const checkoutHistoryCollectionRef = useMemoFirebase(
        () => (firestore && hotelId && user && !isUserLoading ? collection(firestore, 'hotels', hotelId, 'checkoutHistory') : null), 
        [firestore, hotelId, user, isUserLoading]
    );

    const { data: rawStays, isLoading } = useCollection<CheckedOutStay>(checkoutHistoryCollectionRef);

    const checkedOutStays = useMemo(() => {
        if (!rawStays) return [];
        return rawStays.map(s => ({
            ...s, 
            checkInDate: (s.checkInDate as any)?.toDate ? (s.checkInDate as any).toDate() : new Date(s.checkInDate), 
            checkOutDate: (s.checkOutDate as any)?.toDate ? (s.checkOutDate as any).toDate() : new Date(s.checkOutDate)
        }));
    }, [rawStays]);

    if (isLoading || isUserLoading) {
        return <PageLoader />;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Stay Archive</CardTitle>
                    <CardDescription>
                        Review and search through all completed guest stays.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <CheckoutHistoryList checkedOutStays={checkedOutStays} />
                </CardContent>
            </Card>
        </div>
    )
}
