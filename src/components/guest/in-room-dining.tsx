

'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import type { HotelService, ServiceRequest, ServiceCategory } from '@/lib/types';
import { useSettings } from '@/context/settings-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Plus, Minus, ChevronDown, ChevronUp, Search, Utensils } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useStay } from '@/context/stay-context';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useServices } from '@/context/service-context';

export function InRoomDining({ restaurantId }: { restaurantId: string }) {
    const { addServiceRequests, cart, updateCartItemQuantity, isCartSheetOpen, setIsCartSheetOpen } = useStay();
    const { room, stay } = useStay();
    const { hotelServices, restaurants } = useServices();
    const { formatPrice } = useSettings();
    const { toast } = useToast();
    
    const [searchQuery, setSearchQuery] = useState('');
    
    const restaurant = useMemo(() => restaurants.find(r => r.id === restaurantId), [restaurantId, restaurants]);

    const menuItemsByCategory = useMemo(() => {
        if (!restaurantId) return {};
        let menu = hotelServices.filter(s => s.restaurantId === restaurantId && s.category);

        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            menu = menu.filter(item => 
                item.name.toLowerCase().includes(lowercasedQuery) ||
                (item.description && item.description.toLowerCase().includes(lowercasedQuery)) ||
                item.category.toLowerCase().includes(lowercasedQuery)
            );
        }

        return menu.reduce((acc, item) => {
            const cat = item.category.startsWith('F&B:') ? item.category.substring(4) : item.category;
            if (!acc[cat]) {
                acc[cat] = [];
            }
            acc[cat].push(item);
            return acc;
        }, {} as Record<string, HotelService[]>);
    }, [restaurantId, searchQuery, hotelServices]);

    const availableCategories = useMemo(() => {
        return Object.keys(menuItemsByCategory).filter(cat => menuItemsByCategory[cat]?.length > 0);
    }, [menuItemsByCategory]);
    
    const [activeCategory, setActiveCategory] = useState<string>(availableCategories[0]);
    const [isCategoryNavOpen, setIsCategoryNavOpen] = useState(true);
    
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

    useEffect(() => {
        if (availableCategories.length > 0 && !activeCategory) {
            setActiveCategory(availableCategories[0]);
        }
    }, [availableCategories, activeCategory]);

    const handleScroll = useCallback(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const scrollPosition = container.scrollTop + container.offsetTop;
        
        let currentCategory: string | null = null;

        for (let i = availableCategories.length - 1; i >= 0; i--) {
            const category = availableCategories[i];
            const element = categoryRefs.current[category];
            if (element && element.offsetTop <= scrollPosition + 120) {
                currentCategory = category;
                break;
            }
        }
        
        if (currentCategory && currentCategory !== activeCategory) {
            setActiveCategory(currentCategory);
        }
    }, [activeCategory, availableCategories]);
    
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, [handleScroll]);


    const scrollToCategory = (category: string) => {
        const element = categoryRefs.current[category];
        if (element && scrollContainerRef.current) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setIsCategoryNavOpen(false);
        }
    };
    
    const addToCart = (service: HotelService) => {
        const currentQuantity = getItemQuantity(service.id);
        updateCartItemQuantity(service, currentQuantity + 1);
        toast({
            title: `${service.name} added to cart`,
        });
    };

    const getItemQuantity = (serviceId: string) => {
        return cart.find(item => item.service.id === serviceId)?.quantity || 0;
    };

    return (
        <div className="relative flex flex-col h-[calc(100vh-8rem)]">
            <Card className="flex-1 flex flex-col overflow-hidden">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                        <Utensils /> {restaurant?.name || 'In-Room Dining'}
                    </CardTitle>
                    <CardDescription>
                        Browse the menu and place an order directly to your room.
                    </CardDescription>
                    <div className="relative pt-2">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search this menu..." 
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </CardHeader>

                <div className="sticky top-0 bg-background z-10 p-2 border-b">
                   {!isCategoryNavOpen ? (
                        <div className="flex justify-between items-center">
                            <Button
                                variant="outline"
                                className="whitespace-nowrap font-bold"
                            >
                                {activeCategory}
                            </Button>
                            <Button onClick={() => setIsCategoryNavOpen(true)} variant="ghost">
                                View All Categories
                                <ChevronDown className="ml-2" />
                            </Button>
                        </div>
                   ) : (
                        <div>
                             <div className="flex justify-end">
                                <Button onClick={() => setIsCategoryNavOpen(false)} variant="ghost" size="sm">
                                    Collapse
                                    <ChevronUp className="ml-2" />
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {availableCategories.map((cat) => (
                                    <Button
                                        key={cat}
                                        variant={activeCategory === cat ? 'default' : 'outline'}
                                        onClick={() => scrollToCategory(cat)}
                                        className="whitespace-nowrap"
                                        size="sm"
                                    >
                                        {cat}
                                    </Button>
                                ))}
                            </div>
                        </div>
                   )}
                </div>
                
                <ScrollArea className="flex-1" ref={scrollContainerRef}>
                    <CardContent className="pt-4">
                        {availableCategories.length > 0 ? (
                            <div className="space-y-8">
                                {availableCategories.map(category => {
                                    const itemsForCategory = menuItemsByCategory[category] || [];
                                    if (itemsForCategory.length === 0) return null;
                                    return (
                                        <div key={category} ref={el => { categoryRefs.current[category] = el }}>
                                            <h2 className="font-bold text-xl mb-4">{category}</h2>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {itemsForCategory.map((item) => {
                                                    const quantity = getItemQuantity(item.id);
                                                    return (
                                                        <Card key={item.id} className="flex flex-col">
                                                            <CardContent className="p-4 flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <div
                                                                        className={cn(
                                                                            'size-3 rounded-full border-2 border-background shadow-sm',
                                                                            item.dietaryType === 'non-veg' ? 'bg-red-600' : 'bg-green-600'
                                                                        )}
                                                                    />
                                                                    <h3 className="font-semibold">{item.name}</h3>
                                                                </div>
                                                                {item.description && <p className="text-sm text-muted-foreground mt-1">{item.description}</p>}
                                                            </CardContent>
                                                            <CardFooter className="flex items-center justify-between p-4 pt-0">
                                                                <p className="font-semibold text-primary">{formatPrice(item.price)}</p>
                                                                {quantity > 0 ? (
                                                                    <div className="flex items-center gap-2">
                                                                        <Button size="icon" variant="outline" className="size-8" onClick={() => updateCartItemQuantity(item, quantity - 1)}>
                                                                            <Minus className="size-4" />
                                                                        </Button>
                                                                        <span className="font-bold w-5 text-center">{quantity}</span>
                                                                        <Button size="icon" variant="outline" className="size-8" onClick={() => updateCartItemQuantity(item, quantity + 1)}>
                                                                            <Plus className="size-4" />
                                                                        </Button>
                                                                    </div>
                                                                ) : (
                                                                    <Button size="sm" variant="outline" onClick={() => addToCart(item)}>
                                                                        <Plus className="mr-2 size-4" /> Add
                                                                    </Button>
                                                                )}
                                                            </CardFooter>
                                                        </Card>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-16 text-muted-foreground">
                                <p>No menu items found for &quot;{searchQuery}&quot;.</p>
                            </div>
                        )}
                    </CardContent>
                </ScrollArea>
            </Card>
        </div>
    );
}
