'use client';

import { redirect } from 'next/navigation';
import { useEffect } from 'react';

// This page is a fallback. The primary team dashboard is under /[hotelId]/team/dashboard.
// This component redirects any stray traffic to the team login page.
export default function TeamDashboardRedirectPage() {
    useEffect(() => {
        redirect('/login/team');
    }, []);

    return null; // Render nothing while redirecting
}
