
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Hotel, Users } from "lucide-react";
import { useCollection, useMemoFirebase } from "@/firebase";
import { collection, getFirestore } from "firebase/firestore";
import type { Hotel as HotelType } from "@/lib/types";
import { HotelListTable } from "@/components/super-admin/hotel-list-table";
import { ManageRoles } from "@/components/super-admin/manage-roles";

export default function SuperAdminDashboardPage() {
  const firestore = getFirestore();

  const hotelsCollectionRef = useMemoFirebase(() => (firestore ? collection(firestore, 'hotels') : null), [firestore]);
  const { data: allHotels, isLoading: isLoadingHotels } = useCollection<HotelType>(hotelsCollectionRef);
  
  const totalHotels = allHotels?.length || 0;
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">Super Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform-wide overview and management tools for StayCentral.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registered Hotels</CardTitle>
            <Hotel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoadingHotels ? '...' : totalHotels}</div>
            <p className="text-xs text-muted-foreground">Total hotel accounts on the platform.</p>
          </CardContent>
        </Card>
      </div>

      <ManageRoles />

      <Card>
        <CardHeader>
          <CardTitle>Hotel Management</CardTitle>
          <CardDescription>
            View and manage all registered hotels on the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HotelListTable hotels={allHotels || []} isLoading={isLoadingHotels} />
        </CardContent>
      </Card>
    </div>
  );
}
