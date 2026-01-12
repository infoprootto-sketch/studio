
'use client';
import { InRoomDining } from "@/components/guest/in-room-dining";
import { useParams } from 'next/navigation';

export default function OrderRestaurantPage() {
    const params = useParams();
    const restaurantId = params.restaurantId as string;
    return <InRoomDining restaurantId={restaurantId} />;
}
