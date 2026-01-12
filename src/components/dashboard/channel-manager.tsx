'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, Info, Link, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from '../ui/label';
import { Input } from '../ui/input';


type ConnectionStatus = 'connected' | 'disconnected';

interface Channel {
  id: string;
  name: string;
  logo: string;
  status: ConnectionStatus;
}

const initialChannels: Channel[] = [
  { id: 'booking', name: 'Booking.com', logo: 'https://via.placeholder.com/40?text=B', status: 'disconnected' },
  { id: 'agoda', name: 'Agoda', logo: 'https://via.placeholder.com/40?text=A', status: 'disconnected' },
  { id: 'expedia', name: 'Expedia', logo: 'https://via.placeholder.com/40?text=E', status: 'disconnected' },
];

export function ChannelManager() {
  const [channels, setChannels] = useState<Channel[]>(initialChannels);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const { toast } = useToast();

  const handleConnectToggle = (channelId: string) => {
    const channel = channels.find(c => c.id === channelId);
    if (!channel) return;

    if (channel.status === 'disconnected') {
      // Open dialog to "connect"
      setSelectedChannel(channel);
    } else {
      // Disconnect
      setChannels(channels.map(c => c.id === channelId ? { ...c, status: 'disconnected' } : c));
      toast({
        title: `Disconnected from ${channel.name}`,
        description: "Bookings will no longer sync automatically.",
        variant: "destructive",
      });
    }
  };

  const handleConfirmConnect = () => {
    if (!selectedChannel) return;

    setChannels(channels.map(c => c.id === selectedChannel.id ? { ...c, status: 'connected' } : c));
    toast({
      title: `Connection to ${selectedChannel.name} established!`,
      description: "Bookings will now be synced automatically.",
    });
    setSelectedChannel(null); // Close the dialog
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Channel Manager</CardTitle>
          <CardDescription>
            Connect to online travel agencies (OTAs) to sync bookings and availability automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Developer Notice</AlertTitle>
            <AlertDescription>
              This is a UI demonstration of a channel manager. The connections are simulated and do not sync with live OTAs. A backend integration is required for full functionality.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {channels.map((channel) => (
              <Card key={channel.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  {/* <img src={channel.logo} alt={channel.name} className="h-10 w-10 rounded-md" /> */}
                   <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center font-bold text-lg">{channel.name.charAt(0)}</div>
                  <div>
                    <p className="font-semibold">{channel.name}</p>
                    <Badge variant={channel.status === 'connected' ? 'default' : 'outline'} className={channel.status === 'connected' ? 'bg-green-500' : ''}>
                      {channel.status === 'connected' ? 'Connected' : 'Disconnected'}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant={channel.status === 'connected' ? 'destructive' : 'default'}
                  onClick={() => handleConnectToggle(channel.id)}
                >
                  {channel.status === 'connected' ? <XCircle className="mr-2" /> : <Link className="mr-2" />}
                  {channel.status === 'connected' ? 'Disconnect' : 'Connect'}
                </Button>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={!!selectedChannel} onOpenChange={() => setSelectedChannel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect to {selectedChannel?.name}</DialogTitle>
            <DialogDescription>
              Enter your property ID for {selectedChannel?.name} to establish a connection. This is a simulation.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="property-id">{selectedChannel?.name} Property ID</Label>
            <Input id="property-id" placeholder="e.g., 1234567" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedChannel(null)}>Cancel</Button>
            <Button onClick={handleConfirmConnect}>
              <CheckCircle className="mr-2" />
              Confirm Connection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
