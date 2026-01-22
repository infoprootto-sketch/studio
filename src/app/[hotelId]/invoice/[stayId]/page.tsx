
'use client';

import { InvoiceDetails } from "@/components/invoice/invoice-details";
import { BillingProvider } from "@/context/billing-context";
import { HotelIdProvider } from "@/context/hotel-id-context";
import { InventoryProvider } from "@/context/inventory-context";
import { RoomProvider } from "@/context/room-context";
import { ServiceProvider } from "@/context/service-context";
import { SettingsProvider } from "@/context/settings-context";
import { StayProvider } from "@/context/stay-context";
import { useFirestore } from "@/firebase";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TeamProvider } from '@/context/team-context';

export default function InvoicePage({ params }: { params: { hotelId: string, stayId: string } }) {
    const firestore = useFirestore();

    if (!firestore) {
        return (
          <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-lg text-center">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">Services Unavailable</CardTitle>
                <CardDescription>
                  The invoice service is temporarily unavailable. Please contact the front desk for assistance.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        );
    }

    return (
        <HotelIdProvider hotelId={params.hotelId}>
            <SettingsProvider>
                <InventoryProvider>
                    <BillingProvider>
                        <TeamProvider>
                            <RoomProvider>
                                <ServiceProvider>
                                    <StayProvider stayId={params.stayId}>
                                        <InvoiceDetails />
                                    </StayProvider>
                                </ServiceProvider>
                            </RoomProvider>
                        </TeamProvider>
                    </BillingProvider>
                </InventoryProvider>
            </SettingsProvider>
        </HotelIdProvider>
    );
}
