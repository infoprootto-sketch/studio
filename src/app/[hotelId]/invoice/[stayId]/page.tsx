
'use client';

import { InvoiceDetails } from "@/components/invoice/invoice-details";
import { BillingProvider } from "@/context/billing-context";
import { HotelIdProvider } from "@/context/hotel-id-context";
import { InventoryProvider } from "@/context/inventory-context";
import { RoomProvider } from "@/context/room-context";
import { ServiceProvider } from "@/context/service-context";
import { SettingsProvider } from "@/context/settings-context";
import { StayProvider } from "@/context/stay-context";
import { TeamProvider } from "@/context/team-context";


export default function InvoicePage({ params }: { params: { hotelId: string, stayId: string } }) {
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
