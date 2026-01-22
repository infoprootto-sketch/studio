
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import type { HotelService, ServiceRequest, Restaurant, ServiceTiming, ServiceCategory, StockMovement, InventoryItem, Broadcast, Department } from '@/lib/types';
import { useFirestore, useCollection, useMemoFirebase, useUser, FirestorePermissionError, errorEmitter } from '@/firebase';
import { useHotelId } from './hotel-id-context';
import { collection, doc, writeBatch, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
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
    addDoc(broadcastsCollectionRef, broadcastData).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: broadcastsCollectionRef.path,
          operation: 'create',
          requestResourceData: broadcastData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };
  
  const updateBroadcast = (broadcastId: string, updates: Partial<Broadcast>) => {
    if (!firestore || !hotelId) return;
    const broadcastRef = doc(firestore, 'hotels', hotelId, 'broadcasts', broadcastId);
    updateDoc(broadcastRef, updates).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: broadcastRef.path,
          operation: 'update',
          requestResourceData: updates,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };
  
  const deleteBroadcast = (broadcastId: string) => {
    if (!firestore || !hotelId) return;
    const broadcastRef = doc(firestore, 'hotels', hotelId, 'broadcasts', broadcastId);
    deleteDoc(broadcastRef).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: broadcastRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const addServiceCategory = (category: Omit<ServiceCategory, 'id'>) => {
    if (!categoriesCollectionRef) return;
    const existing = serviceCategories.find(c => c.name === category.name);
    if (!existing) {
        addDoc(categoriesCollectionRef, category).catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
              path: categoriesCollectionRef.path,
              operation: 'create',
              requestResourceData: category,
            });
            errorEmitter.emit('permission-error', permissionError);
          });
    }
  };

  const deleteServiceCategory = (categoryId: string) => {
    if (!categoriesCollectionRef || !firestore || !hotelId) return;
    const docRef = doc(firestore, 'hotels', hotelId, 'serviceCategories', categoryId);
    deleteDoc(docRef).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  }

  const deleteServicesByCategory = async (categoryName: string) => {
    if (!firestore || !hotelId) return;
    const batch = writeBatch(firestore);
    const servicesToDelete = hotelServices.filter(s => s.category === categoryName);
    servicesToDelete.forEach(service => {
        const serviceRef = doc(firestore, 'hotels', hotelId, 'hotelServices', service.id);
        batch.delete(serviceRef);
    });
    await batch.commit().catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: 'batch operation',
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      });
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
    await batch.commit().catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: 'batch operation',
          operation: 'update',
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const addServiceRequests = async (requests: Omit<ServiceRequest, 'id'>[]): Promise<string[]> => {
    if (!firestore || !hotelId) return [];
    const serviceRequestsCollection = collection(firestore, `hotels/${hotelId}/serviceRequests`);
    
    const addedIds: string[] = [];
    for (const req of requests) {
      try {
        const docRef = await addDoc(serviceRequestsCollection, req);
        addedIds.push(docRef.id);
      } catch(serverError) {
        const permissionError = new FirestorePermissionError({
            path: serviceRequestsCollection.path,
            operation: 'create',
            requestResourceData: req,
          });
        errorEmitter.emit('permission-error', permissionError);
      }
    }
    return addedIds;
  };

  const addHotelService = (serviceData: Omit<HotelService, 'id'>) => {
    if (!servicesCollectionRef) return;
    addDoc(servicesCollectionRef, serviceData).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: servicesCollectionRef.path,
          operation: 'create',
          requestResourceData: serviceData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };
  
  const updateHotelService = (serviceId: string, updates: Partial<HotelService>) => {
    if (!firestore || !hotelId) return;
    const serviceRef = doc(firestore, 'hotels', hotelId, 'hotelServices', serviceId);
    updateDoc(serviceRef, updates).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: serviceRef.path,
          operation: 'update',
          requestResourceData: updates,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const deleteHotelService = (serviceId: string) => {
    if (!firestore || !hotelId) return;
    const serviceRef = doc(firestore, 'hotels', hotelId, 'hotelServices', serviceId);
    deleteDoc(serviceRef).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: serviceRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };
  
  const addRestaurant = (restaurantData: Omit<Restaurant, 'id'>) => {
    if (!restaurantsCollectionRef) return;
    addDoc(restaurantsCollectionRef, restaurantData).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: restaurantsCollectionRef.path,
          operation: 'create',
          requestResourceData: restaurantData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };
  
  const updateRestaurant = (restaurantId: string, updates: Partial<Restaurant>) => {
    if (!firestore || !hotelId) return;
    const restaurantRef = doc(firestore, 'hotels', hotelId, 'restaurants', restaurantId);
    updateDoc(restaurantRef, updates).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: restaurantRef.path,
          operation: 'update',
          requestResourceData: updates,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const deleteRestaurant = (restaurantId: string) => {
    if (!firestore || !hotelId) return;
    const restaurantRef = doc(firestore, 'hotels', hotelId, 'restaurants', restaurantId);
    deleteDoc(restaurantRef).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: restaurantRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };
  
  const setServiceTimings = (timings: ServiceTiming[]) => {
      if (!timingsCollectionRef) return;
      timings.forEach(timing => {
        if(timing.id) {
          const timingRef = doc(timingsCollectionRef, timing.id);
          updateDoc(timingRef, timing).catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
              path: timingRef.path,
              operation: 'update',
              requestResourceData: timing,
            });
            errorEmitter.emit('permission-error', permissionError);
          });
        }
      })
  }

  const addServiceTiming = (timing: Omit<ServiceTiming, 'id'>) => {
    if (!timingsCollectionRef) return;
    addDoc(timingsCollectionRef, timing).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: timingsCollectionRef.path,
          operation: 'create',
          requestResourceData: timing,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  }
  
  const deleteServiceTiming = (timingId: string) => {
    if(!timingsCollectionRef || !firestore || !hotelId) return;
    const timingRef = doc(firestore, 'hotels', hotelId, 'serviceTimings', timingId);
    deleteDoc(timingRef).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: timingRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      });
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
    
    await batch.commit().catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: 'batch operation',
            operation: 'write',
          });
        errorEmitter.emit('permission-error', permissionError);
    });
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
    
    await batch.commit().catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: 'batch operation',
            operation: 'write',
          });
        errorEmitter.emit('permission-error', permissionError);
    });
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
