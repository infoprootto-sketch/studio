'use client';
import { redirect } from 'next/navigation';

export default function RevenuePage({ params }: { params: { hotelId: string } }) {
  redirect(`/${params.hotelId}/dashboard/revenue-analytics`);
}
