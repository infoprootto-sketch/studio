
import { redirect } from 'next/navigation';

export default function TeamPage({ params }: { params: { hotelId: string } }) {
  redirect(`/${params.hotelId}/team/dashboard`);
}

    