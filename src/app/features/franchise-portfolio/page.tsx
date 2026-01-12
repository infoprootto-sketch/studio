
import { FeaturePage } from '@/components/feature-page';
import React from 'react';
import { allFeatures } from '@/lib/feature-list';

const feature = allFeatures.find(f => f.href === '/features/franchise-portfolio')!;

export default function FranchisePortfolioPage() {
    return <FeaturePage {...feature} currentHref={feature.href} />;
}
