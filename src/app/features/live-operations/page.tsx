
import { FeaturePage } from '@/components/feature-page';
import React from 'react';
import { allFeatures } from '@/lib/feature-list';

const feature = allFeatures.find(f => f.href === '/features/live-operations')!;

export default function LiveOperationsPage() {
    return <FeaturePage {...feature} currentHref={feature.href} />;
}
