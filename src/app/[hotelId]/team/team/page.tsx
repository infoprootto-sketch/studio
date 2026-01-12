'use client';
import TeamPage from '@/app/[hotelId]/dashboard/team/page';

// This component now passes the 'manager' role to the underlying TeamPage
export default function ManagerTeamPage() {
    return <TeamPage role="manager" />;
}
