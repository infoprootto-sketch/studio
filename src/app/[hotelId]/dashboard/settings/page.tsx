
'use client';

import { AiConfigGenerator } from '@/components/dashboard/ai-config-generator';
import { BillingSettings } from '@/components/dashboard/billing-settings';
import { ChannelManager } from '@/components/dashboard/channel-manager';
import { DelegatedAccess } from '@/components/dashboard/delegated-access';
import { HotelSettings } from '@/components/dashboard/hotel-settings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">Settings</h1>
        <p className="text-muted-foreground">Manage your hotel settings and configurations.</p>
      </div>

      <Tabs defaultValue="hotel-settings">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-5">
          <TabsTrigger value="hotel-settings">Hotel Settings</TabsTrigger>
          <TabsTrigger value="billing-config">Billing Config</TabsTrigger>
          <TabsTrigger value="channel-manager">Channel Manager</TabsTrigger>
          <TabsTrigger value="ai-config">AI Configuration</TabsTrigger>
          <TabsTrigger value="delegation">Delegation</TabsTrigger>
        </TabsList>
        <TabsContent value="hotel-settings">
            <HotelSettings />
        </TabsContent>
        <TabsContent value="billing-config">
            <BillingSettings />
        </TabsContent>
        <TabsContent value="channel-manager">
            <ChannelManager />
        </TabsContent>
        <TabsContent value="ai-config">
            <AiConfigGenerator />
        </TabsContent>
        <TabsContent value="delegation">
            <DelegatedAccess />
        </TabsContent>
      </Tabs>
    </div>
  );
}
