

'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Utensils, Search, Clock } from "lucide-react";
import Link from "next/link";
import { useStay } from "@/context/stay-context";
import type { HotelService } from '@/lib/types';
import { useSettings } from '@/context/settings-context';
import { Separator } from '../ui/separator';
import { useServices } from '@/context/service-context';
import { isServiceAvailable } from '@/lib/utils';
import { useHotelId } from '@/context/hotel-id-context';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

interface SearchResult extends HotelService {
    restaurantName: string;
}

export function RestaurantSelection() {
    const { stay } = useStay();
    const hotelId = useHotelId();
    const { hotelServices, restaurants, serviceTimings } = useServices();
    const { formatPrice } = useSettings();
    const [searchQuery, setSearchQuery] = useState('');
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const searchResults = useMemo((): SearchResult[] => {
        if (!searchQuery.trim()) {
            return [];
        }

        const lowercasedQuery = searchQuery.toLowerCase();
        
        return hotelServices
            .filter(item => 
                item.restaurantId && (
                    item.name.toLowerCase().includes(lowercasedQuery) ||
                    (item.description && item.description.toLowerCase().includes(lowercasedQuery)) ||
                    item.category.toLowerCase().includes(lowercasedQuery)
                )
            )
            .map(item => {
                const restaurant = restaurants.find(r => r.id === item.restaurantId);
                return {
                    ...item,
                    restaurantName: restaurant?.name || 'Unknown',
                };
            });

    }, [searchQuery, hotelServices, restaurants]);
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-2xl flex items-center gap-2">
                    <Utensils /> In-Room Dining
                </CardTitle>
                <CardDescription>
                    Search for a specific dish or select a restaurant to view its menu.
                </CardDescription>
                <div className="relative pt-2">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search for pizza, sandwiches, drinks..." 
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {searchQuery.trim() ? (
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Search Results ({searchResults.length})</h3>
                        {searchResults.length > 0 ? (
                            <div className="space-y-4">
                                {searchResults.map(item => (
                                     <Link 
                                        href={`/guest/${hotelId}/${stay?.stayId}/order/${item.restaurantId}`} 
                                        key={item.id}
                                        className="block group"
                                    >
                                        <div className="p-4 border rounded-lg hover:bg-muted/50">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-semibold">{item.name}</p>
                                                    <p className="text-sm text-muted-foreground">{item.restaurantName}</p>
                                                </div>
                                                <p className="font-mono text-sm">{formatPrice(item.price)}</p>
                                            </div>
                                            {item.description && <p className="text-xs text-muted-foreground mt-1">{item.description}</p>}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-muted-foreground py-8">No items found matching your search.</p>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <Separator />
                        <h3 className="text-lg font-semibold text-center">Or Select a Restaurant</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {restaurants.map((restaurant, index) => {
                                const timing = serviceTimings.find(t => t.name === restaurant.name);
                                const isAvailable = isClient ? isServiceAvailable(restaurant.name, serviceTimings, new Date()) : true;
                                const placeholder = PlaceHolderImages.find(p => p.id === `restaurant-${(index % 3) + 1}`) || PlaceHolderImages[0];
                                const imageUrl = restaurant.imageUrl || placeholder.imageUrl;
                                
                                return (
                                <Link 
                                    href={isAvailable ? `/guest/${hotelId}/${stay?.stayId}/order/${restaurant.id}` : '#'}
                                    key={restaurant.id}
                                    className={`block group rounded-lg overflow-hidden relative ${!isAvailable ? 'pointer-events-none' : ''}`}
                                    aria-disabled={!isAvailable}
                                >
                                    <Card className="hover:border-primary transition-colors border-transparent border-2">
                                        <CardContent className="p-0 relative aspect-square flex flex-col justify-end">
                                            <Image 
                                                src={imageUrl}
                                                alt={restaurant.name}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform"
                                                data-ai-hint={placeholder.imageHint}
                                            />
                                            {!isAvailable && (
                                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-center text-white p-2">
                                                    <Clock className="size-6 mb-1"/>
                                                    <p className="font-bold text-sm">Currently Closed</p>
                                                    {timing && <p className="text-xs">Opens at {timing.startTime}</p>}
                                                </div>
                                            )}
                                            <div className="relative p-2 bg-gradient-to-t from-black/80 via-black/50 to-transparent text-white">
                                                <p className="font-bold text-base truncate">{restaurant.name}</p>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {(restaurant.cuisineTags || []).map(tag => (
                                                        <div key={tag} className="text-[10px] px-1.5 py-0.5 bg-white/20 rounded-full">{tag}</div>
                                                    ))}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            )})}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
