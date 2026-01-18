'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import type { HotelService, ServiceRequest, Restaurant, ServiceTiming, ServiceCategory, StockMovement, InventoryItem, Broadcast, Department } from '@/lib/types';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { useHotelId } from './hotel-id-context';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { usePathname } from 'next/navigation';

interface ServiceContextType {
  hotelServices: HotelService[];
  restaurants: Restaurant[];
  serviceRequests: ServiceRequest[];
  serviceTimings: ServiceTiming[];
  serviceCategories: ServiceCategory[];
  broadcasts: Broadcast[];
  addBroadcast: (broadcastData: Omit<Broadcast, 'id'>) => void;
  updateBroadcast: (broadcastId: string, updates: Partial<Broadcast>) => void;
  deleteBroadcast: (broadcastId: string) => void;
  addServiceCategory: (category: Omit<ServiceCategory, 'id'>) => void;
  deleteServiceCategory: (categoryId: string) => void;
  deleteServicesByCategory: (categoryName: string) => void;
  reassignServicesToCategory: (oldCategory: string, newCategory: string) => void;
  addHotelService: (serviceData: Omit<HotelService, 'id'>) => void;
  updateHotelService: (serviceId: string, updates: Partial<HotelService>) => void;
  deleteHotelService: (serviceId: string) => void;
  addRestaurant: (restaurantData: Omit<Restaurant, 'id'>) => void;
  updateRestaurant: (restaurantId: string, updates: Partial<Restaurant>) => void;
  deleteRestaurant: (restaurantId: string) => void;
  addServiceRequests: (requests: Omit<ServiceRequest, 'id'>[]) => Promise<string[]>;
  setServiceTimings: (timings: ServiceTiming[]) => void;
  addServiceTiming: (timing: Omit<ServiceTiming, 'id'>) => void;
  deleteServiceTiming: (timingId: string) => void;
  reassignAndRemoveCategory: (restaurantId: string, oldCategory: string, newCategory: string) => void;
  editRestaurantCategory: (restaurantId: string, oldCategory: string, newCategory: string) => void;
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

export function ServiceProvider({ children }: { children: ReactNode }) {
  const firestore = useFirestore();
  const hotelId = useHotelId();
  const { user, isUserLoading } = useUser();
  const pathname = usePathname();

  const isGuestPortal = pathname.startsWith('/guest');

  // Public collections - always fetch
  const servicesCollectionRef = useMemoFirebase(() => (firestore && hotelId ? collection(firestore, 'hotels', hotelId, 'hotelServices') : null), [firestore, hotelId]);
  const restaurantsCollectionRef = useMemoFirebase(() => (firestore && hotelId ? collection(firestore, 'hotels', hotelId, 'restaurants') : null), [firestore, hotelId]);
  const timingsCollectionRef = useMemoFirebase(() => (firestore && hotelId ? collection(firestore, 'hotels', hotelId, 'serviceTimings') : null), [firestore, hotelId]);
  const categoriesCollectionRef = useMemoFirebase(() => (firestore && hotelId ? collection(firestore, 'hotels', hotelId, 'serviceCategories') : null), [firestore, hotelId]);
  const broadcastsCollectionRef = useMemoFirebase(() => (firestore && hotelId ? collection(firestore, 'hotels', hotelId, 'broadcasts') : null), [firestore, hotelId]);

  // Protected collection - only fetch for authenticated staff users on non-guest pages
  const requestsCollectionRef = useMemoFirebase(() => {
    if (!isGuestPortal && firestore && hotelId && user && !isUserLoading) {
      return collection(firestore, 'hotels', hotelId, 'serviceRequests');
    }
    return null;
  }, [isGuestPortal, firestore, hotelId, user, isUserLoading]);

  const { data: hotelServicesData } = useCollection<HotelService>(servicesCollectionRef);
  const { data: restaurantsData } = useCollection<Restaurant>(restaurantsCollectionRef);
  const { data: serviceRequestsData } = useCollection<ServiceRequest>(requestsCollectionRef);
  const { data: serviceTimingsData } = useCollection<ServiceTiming>(timingsCollectionRef);
  const { data: serviceCategoriesData } = useCollection<ServiceCategory>(categoriesCollectionRef);
  const { data: broadcastsData } = useCollection<Broadcast>(broadcastsCollectionRef);
  
  const hotelServices = useMemo(() => hotelServicesData || [], [hotelServicesData]);
  const restaurants = useMemo(() => restaurantsData || [], [restaurantsData]);
  const serviceTimings = useMemo(() => serviceTimingsData || [], [serviceTimingsData]);
  const serviceCategories = useMemo(() => serviceCategoriesData || [], [serviceCategoriesData]);
  
  const broadcasts = useMemo(() => {
    if (!broadcastsData) return [];
    return broadcastsData.map(b => ({
      ...b,
      startDate: (b.startDate as any)?.toDate ? (b.startDate as any).toDate() : new Date(b.startDate),
      endDate: (b.endDate as any)?.toDate ? (b.endDate as any).toDate() : new Date(b.endDate),
    }))
  }, [broadcastsData]);


  const serviceRequests = useMemo(() => {
    if (!serviceRequestsData) return [];
    return serviceRequestsData.map(req => ({
      ...req,
      creationTime: (req.creationTime as any)?.toDate ? (req.creationTime as any).toDate() : new Date(req.creationTime),
      completionTime: req.completionTime && (req.completionTime as any)?.toDate ? (req.completionTime as any).toDate() : (req.completionTime ? new Date(req.completionTime) : undefined),
    }));
  }, [serviceRequestsData]);

  const addBroadcast = (broadcastData: Omit<Broadcast, 'id'>) => {
    if (!broadcastsCollectionRef) return;
    addDocumentNonBlocking(broadcastsCollectionRef, broadcastData);
  };
  
  const updateBroadcast = (broadcastId: string, updates: Partial<Broadcast>) => {
    if (!firestore || !hotelId) return;
    const broadcastRef = doc(firestore, 'hotels', hotelId, 'broadcasts', broadcastId);
    updateDocumentNonBlocking(broadcastRef, updates);
  };
  
  const deleteBroadcast = (broadcastId: string) => {
    if (!firestore || !hotelId) return;
    const broadcastRef = doc(firestore, 'hotels', hotelId, 'broadcasts', broadcastId);
    deleteDocumentNonBlocking(broadcastRef);
  };

  const addServiceCategory = (category: Omit<ServiceCategory, 'id'>) => {
    if (!categoriesCollectionRef) return;
    const existing = serviceCategories.find(c => c.name === category.name);
    if (!existing) {
        addDocumentNonBlocking(categoriesCollectionRef, category);
    }
  };

  const deleteServiceCategory = (categoryId: string) => {
    if (!categoriesCollectionRef || !firestore || !hotelId) return;
    const docRef = doc(firestore, 'hotels', hotelId, 'serviceCategories', categoryId);
    deleteDocumentNonBlocking(docRef);
  }

  const deleteServicesByCategory = async (categoryName: string) => {
    if (!firestore || !hotelId) return;
    const batch = writeBatch(firestore);
    const servicesToDelete = hotelServices.filter(s => s.category === categoryName);
    servicesToDelete.forEach(service => {
        const serviceRef = doc(firestore, 'hotels', hotelId, 'hotelServices', service.id);
        batch.delete(serviceRef);
    });
    await batch.commit();
  };

  const reassignServicesToCategory = async (oldCategory: string, newCategory: string) => {
    if (!firestore || !hotelId) return;
    const batch = writeBatch(firestore);
    
    if (!serviceCategories.some(c => c.name === newCategory && c.type === 'Other')) {
        addServiceCategory({ name: newCategory, type: 'Other' });
    }
    
    const servicesToUpdate = hotelServices.filter(s => s.category === oldCategory);
    servicesToUpdate.forEach(service => {
        const serviceRef = doc(firestore, 'hotels', hotelId, 'hotelServices', service.id);
        batch.update(serviceRef, { category: newCategory });
    });
    await batch.commit();
  };

  const addServiceRequests = async (requests: Omit<ServiceRequest, 'id'>[]): Promise<string[]> => {
    const serviceRequestsCollection = collection(firestore!, `hotels/${hotelId}/serviceRequests`);
    if (!serviceRequestsCollection) return [];
    
    const addedIds: string[] = [];
    for (const req of requests) {
      const docRef = await addDocumentNonBlocking(serviceRequestsCollection, req);
      if (docRef) {
        addedIds.push(docRef.id);
      }
    }
    return addedIds;
  };

  const addHotelService = (serviceData: Omit<HotelService, 'id'>) => {
    if (!servicesCollectionRef) return;
    addDocumentNonBlocking(servicesCollectionRef, serviceData);
  };
  
  const updateHotelService = (serviceId: string, updates: Partial<HotelService>) => {
    if (!firestore || !hotelId) return;
    const serviceRef = doc(firestore, 'hotels', hotelId, 'hotelServices', serviceId);
    updateDocumentNonBlocking(serviceRef, updates);
  };

  const deleteHotelService = (serviceId: string) => {
    if (!firestore || !hotelId) return;
    const serviceRef = doc(firestore, 'hotels', hotelId, 'hotelServices', serviceId);
    deleteDocumentNonBlocking(serviceRef);
  };
  
  const addRestaurant = (restaurantData: Omit<Restaurant, 'id'>) => {
    if (!restaurantsCollectionRef) return;
    addDocumentNonBlocking(restaurantsCollectionRef, restaurantData);
  };
  
  const updateRestaurant = (restaurantId: string, updates: Partial<Restaurant>) => {
    if (!firestore || !hotelId) return;
    const restaurantRef = doc(firestore, 'hotels', hotelId, 'restaurants', restaurantId);
    updateDocumentNonBlocking(restaurantRef, updates);
  };

  const deleteRestaurant = (restaurantId: string) => {
    if (!firestore || !hotelId) return;
    const restaurantRef = doc(firestore, 'hotels', hotelId, 'restaurants', restaurantId);
    deleteDocumentNonBlocking(restaurantRef);
  };
  
  const setServiceTimings = (timings: ServiceTiming[]) => {
      if (!timingsCollectionRef) return;
      timings.forEach(timing => {
        if(timing.id) {
          const timingRef = doc(timingsCollectionRef, timing.id);
          updateDocumentNonBlocking(timingRef, timing);
        }
      })
  }

  const addServiceTiming = (timing: Omit<ServiceTiming, 'id'>) => {
    if (!timingsCollectionRef) return;
    addDocumentNonBlocking(timingsCollectionRef, timing);
  }
  
  const deleteServiceTiming = (timingId: string) => {
    if(!timingsCollectionRef || !firestore || !hotelId) return;
    const timingRef = doc(firestore, 'hotels', hotelId, 'serviceTimings', timingId);
    deleteDocumentNonBlocking(timingRef);
  }

  const reassignAndRemoveCategory = async (restaurantId: string, oldCategory: string, newCategory: string) => {
    if (!firestore || !hotelId) return;

    const batch = writeBatch(firestore);
    
    // 1. Update services
    const servicesToUpdate = hotelServices.filter(
      s => s.restaurantId === restaurantId && s.category.replace('F&B:','') === oldCategory
    );

    servicesToUpdate.forEach(service => {
      const serviceRef = doc(firestore, 'hotels', hotelId, 'hotelServices', service.id);
      batch.update(serviceRef, { category: `F&B:${newCategory}` });
    });

    // 2. Update restaurant categories
    const restaurant = restaurants.find(r => r.id === restaurantId);
    if (restaurant) {
      const restaurantRef = doc(firestore, 'hotels', hotelId, 'restaurants', restaurantId);
      const updatedCategories = (restaurant.categories || []).filter(c => c !== oldCategory);
      if (!updatedCategories.includes(newCategory)) {
        updatedCategories.push(newCategory);
      }
      batch.update(restaurantRef, { categories: updatedCategories });
    }
    
    await batch.commit();
  };

  const editRestaurantCategory = async (restaurantId: string, oldCategory: string, newCategory: string) => {
    if (!firestore || !hotelId) return;

    const batch = writeBatch(firestore);
    
    // 1. Update services
    const servicesToUpdate = hotelServices.filter(
      s => s.restaurantId === restaurantId && s.category.replace('F&B:','') === oldCategory
    );

    servicesToUpdate.forEach(service => {
      const serviceRef = doc(firestore, 'hotels', hotelId, 'hotelServices', service.id);
      batch.update(serviceRef, { category: `F&B:${newCategory}` });
    });

    // 2. Update restaurant categories
    const restaurant = restaurants.find(r => r.id === restaurantId);
    if (restaurant) {
      const restaurantRef = doc(firestore, 'hotels', hotelId, 'restaurants', restaurantId);
      const updatedCategories = (restaurant.categories || []).map(c => c === oldCategory ? newCategory : c);
      batch.update(restaurantRef, { categories: updatedCategories });
    }
    
    await batch.commit();
  };


  const value = { 
    hotelServices, 
    restaurants, 
    serviceRequests,
    serviceTimings,
    serviceCategories,
    broadcasts,
    addBroadcast,
    updateBroadcast,
    deleteBroadcast,
    addServiceCategory,
    deleteServiceCategory,
    deleteServicesByCategory,
    reassignServicesToCategory,
    addHotelService,
    updateHotelService,
    deleteHotelService,
    addRestaurant,
    updateRestaurant,
    deleteRestaurant,
    addServiceRequests,
    setServiceTimings,
    addServiceTiming,
    deleteServiceTiming,
    reassignAndRemoveCategory,
    editRestaurantCategory,
  };

  return (
    <ServiceContext.Provider value={value}>
      {children}
    </ServiceContext.Provider>
  );
}

export function useServices() {
  const context = useContext(ServiceContext);
  if (context === undefined) {
    throw new Error('useServices must be used within a ServiceProvider');
  }
  return context;
}
