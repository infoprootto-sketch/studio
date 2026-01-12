
'use client';
import { redirect } from 'next/navigation';

export default function AnalyticsPage({ params }: { params: { hotelId: string } }) {
  redirect(`/${params.hotelId}/dashboard/revenue-analytics`);
}
