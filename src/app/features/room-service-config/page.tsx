
import { FeaturePage } from '@/components/feature-page';
import React from 'react';
import { allFeatures } from '@/lib/feature-list';

const feature = allFeatures.find(f => f.href === '/features/room-service-config')!;

export default function RoomServiceConfigPage() {
    return <FeaturePage {...feature} currentHref={feature.href} />;
}
