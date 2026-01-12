
import { FeaturePage } from '@/components/feature-page';
import React from 'react';
import { allFeatures } from '@/lib/feature-list';

const feature = allFeatures.find(f => f.href === '/features/inventory-control')!;

export default function InventoryControlPage() {
    return <FeaturePage {...feature} currentHref={feature.href} />;
}
