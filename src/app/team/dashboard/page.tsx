'use client';

import { useMemo } from 'react';
import { useUser } from '@/firebase';
import { useTeam } from '@/context/team-context';
import { ManagerDashboard } from '@/components/team/manager-dashboard';
import { MemberDashboard } from '@/components/team/member-dashboard';
import { PageLoader } from '@/components/common/page-loader';

export default function TeamDashboardPage() {
    const { user, isUserLoading } = useUser();
    const { teamMembers } = useTeam();

    const currentUser = useMemo(() => {
        if (!user || !teamMembers) return null;
        const memberProfile = teamMembers.find(m => m.id === user.uid);
        return memberProfile || null;
    }, [user, teamMembers]);

    if (isUserLoading || !currentUser) {
        return <PageLoader />;
    }

    if (currentUser.role === 'Manager') {
        return <ManagerDashboard department={currentUser.department} />;
    }

    return <MemberDashboard />;
}
