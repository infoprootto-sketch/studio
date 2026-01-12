'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HotelListTable } from '@/components/super-admin/hotel-list-table';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, getFirestore } from 'firebase/firestore';
import type { Hotel as HotelType } from '@/lib/types';

export default function SuperAdminHotelsPage() {
  const firestore = getFirestore();

  const hotelsCollectionRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'hotels') : null),
    [firestore]
  );
  const { data: allHotels, isLoading: isLoadingHotels } =
    useCollection<HotelType>(hotelsCollectionRef);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Hotel Management</CardTitle>
          <CardDescription>
            View and manage all registered hotels on the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HotelListTable
            hotels={allHotels || []}
            isLoading={isLoadingHotels}
          />
        </CardContent>
      </Card>
    </div>
  );
}
