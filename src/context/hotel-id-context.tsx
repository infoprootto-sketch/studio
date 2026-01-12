'use client';
import React, { createContext, useContext, ReactNode } from 'react';

const HotelIdContext = createContext<string | undefined>(undefined);

export function HotelIdProvider({ children, hotelId }: { children: ReactNode; hotelId: string }) {
  return (
    <HotelIdContext.Provider value={hotelId}>
      {children}
    </HotelIdContext.Provider>
  );
}

export function useHotelId() {
  const context = useContext(HotelIdContext);
  if (context === undefined) {
    throw new Error('useHotelId must be used within a HotelIdProvider');
  }
  return context;
}
