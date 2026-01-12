
'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import type { Hotel, TeamMember } from "@/lib/types";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { useEffect, useState, useMemo } from "react";
import { PageLoader } from "@/components/common/page-loader";
import { FranchiseHotelListTable } from "@/components/franchise/franchise-hotel-list-table";

export default function FranchiseDashboardPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const [delegatedHotels, setDelegatedHotels] = useState<Hotel[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const hotelsCollectionRef = useMemoFirebase(() => (firestore ? collection(firestore, 'hotels') : null), [firestore]);
    const { data: allHotels, isLoading: isLoadingHotels } = useCollection<Hotel>(hotelsCollectionRef);

    useEffect(() => {
        if (!user || isUserLoading || isLoadingHotels || !allHotels || !firestore) {
            return;
        }

        const fetchDelegations = async () => {
            setIsLoading(true);
            
            const hotelIdsWithAccess: string[] = [];

            // This is not the most performant query for very large scale, but it's secure and functional for this prototype.
            // A better solution would involve a backend function or duplicating delegation info.
            for (const hotel of allHotels) {
                const delegateRef = doc(firestore, 'hotels', hotel.id, 'delegates', user.uid);
                try {
                    const delegateSnap = await getDoc(delegateRef);
                    if (delegateSnap.exists()) {
                        hotelIdsWithAccess.push(hotel.id);
                    }
                } catch (e) {
                    // This can happen if rules block even checking existence, though our current rules allow it.
                    // We'll ignore errors and only include what's accessible.
                }
            }

            setDelegatedHotels(allHotels.filter(h => hotelIdsWithAccess.includes(h.id)));
            setIsLoading(false);
        };

        fetchDelegations();

    }, [user, isUserLoading, allHotels, isLoadingHotels, firestore]);
    

    if (isUserLoading || isLoading) {
        return <PageLoader />;
    }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">Franchise Dashboard</h1>
        <p className="text-muted-foreground">Portfolio-wide overview of your hotels.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Hotel Portfolio</CardTitle>
          <CardDescription>
            You have read-only analytical access to the following hotels.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <FranchiseHotelListTable hotels={delegatedHotels} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
