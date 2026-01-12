import { redirect } from 'next/navigation';

export default function ReceptionPage({ params }: { params: { hotelId: string } }) {
  redirect(`/${params.hotelId}/reception/dashboard`);
}
