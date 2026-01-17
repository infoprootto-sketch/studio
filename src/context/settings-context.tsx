
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import { countries, type Country, type Currency, type Language } from '@/lib/countries-currencies';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { useHotelId } from './hotel-id-context';
import { doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

interface HotelSettingsData {
  country?: string;
  currency?: string;
  language?: string;
  legalName?: string;
  address?: string;
  gstNumber?: string;
  gstRate?: number;
  serviceChargeRate?: number;
  wifiSSID?: string;
  wifiPassword?: string;
}

interface SettingsContextType {
  hotelId: string;
  country: string;
  setCountry: (country: string) => void;
  currency: string;
  setCurrency: (currency: string) => void;
  language: string;
  setLanguage: (language: string) => void;
  formatPrice: (price: number) => string;
  getCountryData: (countryCode: string) => Country | undefined;
  legalName: string;
  setLegalName: (name: string) => void;
  address: string;
  setAddress: (address: string) => void;
  gstNumber: string;
  setGstNumber: (gstNumber: string) => void;
  gstRate: number;
  setGstRate: (rate: number) => void;
  serviceChargeRate: number;
  setServiceChargeRate: (rate: number) => void;
  wifiSSID: string;
  wifiPassword: string;
  saveSettings: (settings: Partial<HotelSettingsData>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const INDIA_COUNTRY_CODE = 'IN';
const indiaData = countries.find(c => c.code === INDIA_COUNTRY_CODE)!;

const defaultSettings = {
    country: indiaData.code,
    currency: indiaData.currencies[0].code,
    language: indiaData.languages.find(l => l.code === 'en')?.code || indiaData.languages[0].code,
    legalName: 'StayCentral Hotels Pvt. Ltd.',
    address: '123 Luxury Avenue, Mumbai, Maharashtra 400001',
    gstNumber: '27ABCDE1234F1Z5',
    gstRate: 18,
    serviceChargeRate: 10,
    wifiSSID: 'HotelGuest_5G',
    wifiPassword: 'welcomeguest'
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  const firestore = useFirestore();
  const hotelId = useHotelId();
  const { user, isUserLoading } = useUser();

  const settingsDocRef = useMemoFirebase(
    () => (firestore && hotelId && user && !isUserLoading ? doc(firestore, 'hotels', hotelId, 'config', 'settings') : null),
    [firestore, hotelId, user, isUserLoading]
  );

  const { data: settingsData } = useDoc<HotelSettingsData>(settingsDocRef);
  
  const settings = useMemo(() => {
    return { ...defaultSettings, ...(settingsData || {}) };
  }, [settingsData]);


  useEffect(() => {
    setIsClient(true);
  }, []);

  const saveSettings = (updates: Partial<HotelSettingsData>) => {
    if (!settingsDocRef) return;
    updateDocumentNonBlocking(settingsDocRef, updates);
  };
  
  const getCountryData = (countryCode: string) => {
    return countries.find(c => c.code === countryCode);
  }

  const formatPrice = (price: number) => {
    if (!isClient) return `₹${price.toFixed(2)}`; // Fallback for server render
    try {
      return new Intl.NumberFormat(settings.language, { style: 'currency', currency: settings.currency }).format(price);
    } catch (e) {
      console.error(`Invalid currency code: ${settings.currency}`);
      return `₹${price.toFixed(2)}`;
    }
  };
  
  const setCountry = (countryCode: string) => {
    const countryData = countries.find(c => c.code === countryCode);
    if (countryData) {
      saveSettings({ 
        country: countryCode, 
        currency: countryData.currencies[0].code, 
        language: countryData.languages[0].code 
      });
    }
  };

  const value: SettingsContextType = {
    hotelId,
    country: settings.country,
    currency: settings.currency,
    language: settings.language,
    legalName: settings.legalName,
    address: settings.address,
    gstNumber: settings.gstNumber,
    gstRate: settings.gstRate,
    serviceChargeRate: settings.serviceChargeRate,
    wifiSSID: settings.wifiSSID,
    wifiPassword: settings.wifiPassword,
    setCountry,
    setCurrency: (currency: string) => saveSettings({ currency }),
    setLanguage: (language: string) => saveSettings({ language }),
    setLegalName: (name: string) => saveSettings({ legalName: name }),
    setAddress: (address: string) => saveSettings({ address }),
    setGstNumber: (gst: string) => saveSettings({ gstNumber: gst }),
    setGstRate: (rate: number) => saveSettings({ gstRate: rate }),
    setServiceChargeRate: (rate: number) => saveSettings({ serviceChargeRate: rate }),
    getCountryData,
    formatPrice,
    saveSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
