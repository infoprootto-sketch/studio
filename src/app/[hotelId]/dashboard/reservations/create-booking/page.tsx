
'use client';

import { BookingForm } from "@/components/dashboard/booking-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useHotelId } from "@/context/hotel-id-context";

export default function CreateBookingPage() {
    const hotelId = useHotelId();
    return (
        <div className="space-y-4">
             <Button variant="outline" asChild>
                <Link href={`/${hotelId}/dashboard/reservations`}>
                    <ArrowLeft className="mr-2" />
                    Back to Reservations
                </Link>
            </Button>
            <Card>
                <CardHeader>
                    <CardTitle>Create New Booking</CardTitle>
                    <CardDescription>Select dates and rooms to create a new single or group booking.</CardDescription>
                </CardHeader>
                <CardContent>
                    <BookingForm />
                </CardContent>
            </Card>
        </div>
    )
}
