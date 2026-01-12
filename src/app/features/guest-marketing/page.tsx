
import { FeaturePage } from '@/components/feature-page';
import React from 'react';
import { allFeatures } from '@/lib/feature-list';

const feature = allFeatures.find(f => f.href === '/features/guest-marketing')!;

export default function GuestMarketingPage() {
    return <FeaturePage {...feature} currentHref={feature.href} />;
}
