
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettings } from '@/context/settings-context';
import { countries } from '@/lib/countries-currencies';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';
import { Separator } from '../ui/separator';

export function HotelSettings() {
  const { 
    country, currency, language, wifiSSID, wifiPassword,
    setCountry, setCurrency, setLanguage, 
    saveSettings, getCountryData 
  } = useSettings();
  
  const [selectedCountry, setSelectedCountry] = useState(country);
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [localWifiSSID, setLocalWifiSSID] = useState(wifiSSID);
  const [localWifiPassword, setLocalWifiPassword] = useState(wifiPassword);
  
  const { toast } = useToast();

  const countryData = getCountryData(selectedCountry);

  useEffect(() => {
    setSelectedCountry(country);
    setSelectedCurrency(currency);
    setSelectedLanguage(language);
    setLocalWifiSSID(wifiSSID);
    setLocalWifiPassword(wifiPassword);
  }, [country, currency, language, wifiSSID, wifiPassword]);

  const handleSave = () => {
    saveSettings({
        country: selectedCountry,
        currency: selectedCurrency,
        language: selectedLanguage,
        wifiSSID: localWifiSSID,
        wifiPassword: localWifiPassword
    });
    toast({
      title: 'Settings Saved',
      description: 'Your hotel settings have been updated.',
    });
  };

  const handleCountryChange = (countryCode: string) => {
      setSelectedCountry(countryCode);
      const newCountryData = getCountryData(countryCode);
      if (newCountryData) {
          setSelectedCurrency(newCountryData.currencies[0].code);
          setSelectedLanguage(newCountryData.languages.find(l => l.code === 'en')?.code || newCountryData.languages[0].code);
      }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hotel Settings</CardTitle>
        <CardDescription>Manage your hotel's localization, language, and guest-facing information.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
            <h3 className="font-medium">Localization</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select value={selectedCountry} onValueChange={handleCountryChange}>
                    <SelectTrigger id="country">
                    <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                    <SelectContent>
                    {countries.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                        {c.name}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                </div>
                <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={selectedCurrency} onValueChange={setSelectedCurrency} disabled={!countryData || countryData.currencies.length <= 1}>
                    <SelectTrigger id="currency">
                    <SelectValue placeholder="Select a currency" />
                    </SelectTrigger>
                    <SelectContent>
                    {countryData?.currencies.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                        {c.name} ({c.symbol})
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                </div>
                 <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage} disabled={!countryData || countryData.languages.length <= 1}>
                    <SelectTrigger id="language">
                    <SelectValue placeholder="Select a language" />
                    </SelectTrigger>
                    <SelectContent>
                    {countryData?.languages.map((l) => (
                        <SelectItem key={l.code} value={l.code}>
                        {l.name}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                </div>
            </div>
        </div>
        <Separator />
        <div className="space-y-4">
            <h3 className="font-medium">Guest Wi-Fi</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="wifi-ssid">Wi-Fi Network Name (SSID)</Label>
                    <Input id="wifi-ssid" value={localWifiSSID} onChange={(e) => setLocalWifiSSID(e.target.value)} placeholder="e.g., HotelGuest_5G" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="wifi-password">Wi-Fi Password</Label>
                    <Input id="wifi-password" value={localWifiPassword} onChange={(e) => setLocalWifiPassword(e.target.value)} placeholder="e.g., welcome123" />
                </div>
             </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave}>
          <Save className="mr-2" />
          Save Settings
        </Button>
      </CardFooter>
    </Card>
  );
}
