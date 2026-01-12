
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useSettings } from '@/context/settings-context';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

export function BillingSettings() {
  const { 
    legalName, address, gstNumber, gstRate, serviceChargeRate, saveSettings
  } = useSettings();
  
  const [localLegalName, setLocalLegalName] = useState(legalName);
  const [localAddress, setLocalAddress] = useState(address);
  const [localGstNumber, setLocalGstNumber] = useState(gstNumber);
  const [localGstRate, setLocalGstRate] = useState<number | ''>(gstRate);
  const [localServiceChargeRate, setLocalServiceChargeRate] = useState<number | ''>(serviceChargeRate);
  
  const { toast } = useToast();

  useEffect(() => {
    setLocalLegalName(legalName);
    setLocalAddress(address);
    setLocalGstNumber(gstNumber);
    setLocalGstRate(gstRate);
    setLocalServiceChargeRate(serviceChargeRate);
  }, [legalName, address, gstNumber, gstRate, serviceChargeRate]);

  const handleSave = () => {
    if (!localLegalName || !localAddress || localGstRate === '' || localServiceChargeRate === '') {
        toast({
            variant: "destructive",
            title: "Missing Information",
            description: "Please fill out all required billing fields.",
        });
        return;
    }

    saveSettings({
      legalName: localLegalName,
      address: localAddress,
      gstNumber: localGstNumber,
      gstRate: Number(localGstRate),
      serviceChargeRate: Number(localServiceChargeRate),
    });
    
    toast({
      title: 'Billing Settings Saved',
      description: 'Your billing configuration has been updated.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing Configuration</CardTitle>
        <CardDescription>Manage the legal and tax information that appears on invoices.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
            <Label htmlFor="legal-name">Legal Name of Hotel</Label>
            <Input id="legal-name" value={localLegalName} onChange={(e) => setLocalLegalName(e.target.value)} />
        </div>
        <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" value={localAddress} onChange={(e) => setLocalAddress(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
                <Label htmlFor="gst-number">GST Number</Label>
                <Input id="gst-number" value={localGstNumber} onChange={(e) => setLocalGstNumber(e.target.value)} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="gst-rate">GST (%)</Label>
                <Input id="gst-rate" type="number" value={localGstRate} onChange={(e) => setLocalGstRate(e.target.value === '' ? '' : Number(e.target.value))} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="service-charge">Service Charge (%)</Label>
                <Input id="service-charge" type="number" value={localServiceChargeRate} onChange={(e) => setLocalServiceChargeRate(e.target.value === '' ? '' : Number(e.target.value))} />
            </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave}>
          <Save className="mr-2" />
          Save Billing Settings
        </Button>
      </CardFooter>
    </Card>
  );
}
