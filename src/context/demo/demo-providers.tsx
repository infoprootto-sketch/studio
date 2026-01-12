
'use client';

import { RoomProvider } from '@/context/room-context';
import { ServiceProvider } from '@/context/service-context';
import { TeamProvider } from '@/context/team-context';
import { BillingProvider } from '@/context/billing-context';
import React, { ReactNode } from 'react';

// These components will wrap the production providers
// and supply them with the initial mock data for the demo.
// NOTE: For a real demo, you might want to create specialized
// versions of the providers that don't write to Firestore.
// For this prototype, we will just use the production providers.

export const DemoRoomProvider = ({ children }: { children: ReactNode }) => {
  return <RoomProvider>{children}</RoomProvider>;
};

export const DemoServiceProvider = ({ children }: { children: ReactNode }) => {
  return <ServiceProvider>{children}</ServiceProvider>;
};

export const DemoTeamProvider = ({ children }: { children: ReactNode }) => {
    return <TeamProvider>{children}</TeamProvider>;
};

export const DemoBillingProvider = ({ children }: { children: ReactNode }) => {
    return <BillingProvider>{children}</BillingProvider>;
};
