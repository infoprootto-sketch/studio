
'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ServiceManagementList } from "@/components/dashboard/service-management-list";
import { Button } from '@/components/ui/button';
import { Clock, PlusCircle, ChevronsUpDown, Check } from 'lucide-react';
import { ServiceTimingsDialog } from '@/components/dashboard/service-timings-dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Utensils, ConciergeBell } from 'lucide-react';
import { EditServiceDialog } from '@/components/dashboard/edit-service-dialog';
import type { HotelService, Restaurant, ServiceCategory } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { RestaurantManagement } from '@/components/dashboard/restaurant-management';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandInput, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useServices } from '@/context/service-context';


const suggestedCategories: string[] = ["Laundry", "Maintenance", "Housekeeping", "SPA", "GYM"];


export default function ServicesPage() {
    const { 
        hotelServices,
        restaurants,
        serviceCategories,
        addRestaurant, updateRestaurant, deleteRestaurant,
        addHotelService, updateHotelService, deleteHotelService,
        addServiceCategory,
        deleteServiceCategory,
    } = useServices();
    const [isTimingsDialogOpen, setIsTimingsDialogOpen] = useState(false);
    const [selectedService, setSelectedService] = useState<Partial<HotelService> | null>(null);
    const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
    const [dialogType, setDialogType] = useState<'food' | 'other'>('food');
    const [currentRestaurantId, setCurrentRestaurantId] = useState<string | undefined>();
    
    const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isCategoryPopoverOpen, setIsCategoryPopoverOpen] = useState(false);


    const { toast } = useToast();

    const handleOpenServiceDialog = (service?: Partial<HotelService>, type: 'food' | 'other' = 'food', restaurantId?: string) => {
        setSelectedService(service || null);
        setDialogType(type);
        setCurrentRestaurantId(restaurantId || service?.restaurantId);
        setIsServiceDialogOpen(true);
    };

    const handleCloseServiceDialog = () => {
        setIsServiceDialogOpen(false);
        setSelectedService(null);
        setCurrentRestaurantId(undefined);
    };

    const handleSaveService = (serviceData: Partial<HotelService>) => {
        if (serviceData.id) {
            updateHotelService(serviceData.id, serviceData);
            toast({
                title: "Service Updated",
                description: `The service "${serviceData.name}" has been successfully updated.`,
            });
        } else {
            addHotelService(serviceData as Omit<HotelService, 'id'>);
            toast({
                title: "Service Added",
                description: `The service "${serviceData.name}" has been successfully added.`,
            });
        }
        
        if (serviceData.category) {
            const categoryName = dialogType === 'food' ? serviceData.category.replace('F&B:','') : serviceData.category;
            const categoryType = dialogType === 'food' ? 'F&B' : 'Other';
            if (!serviceCategories.find(c => c.name === categoryName)) {
                addServiceCategory({ name: categoryName, type: categoryType });
            }
        }
    };
    
    const handleDeleteService = (serviceId: string) => {
        const serviceName = hotelServices.find(s => s.id === serviceId)?.name;
        deleteHotelService(serviceId);
        toast({
            title: "Service Deleted",
            description: `The service "${serviceName}" has been successfully removed.`,
            variant: "destructive"
        });
    };

    const handleAddExtractedItems = (items: HotelService[], restaurantId: string) => {
        const newServices = items.map(item => ({
            ...item,
            restaurantId: restaurantId,
        }));
        
        newServices.forEach(service => {
            addHotelService(service as Omit<HotelService, 'id'>);
        });

        toast({
            title: "Menu Items Added",
            description: `${newServices.length} items have been added.`,
        });
      };
      
    const handleSaveNewCategory = () => {
        if (!newCategoryName.trim()) {
            toast({
                variant: 'destructive',
                title: 'Category name cannot be empty.'
            });
            return;
        }
        addServiceCategory({name: newCategoryName, type: 'Other'});
        toast({
            title: 'Category Added',
            description: `"${newCategoryName}" can now be used for services.`
        });
        setNewCategoryName('');
        setIsCategoryDialogOpen(false);
    }
    
    const availableCategorySuggestions = useMemo(() => {
        return suggestedCategories.filter(cat => !serviceCategories.find(c => c.name === cat));
    }, [serviceCategories]);

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Service Management</CardTitle>
                        <CardDescription>Add, edit, or remove the services your hotel offers and manage their timings.</CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => setIsTimingsDialogOpen(true)}>
                        <Clock className="mr-2" />
                        Manage Timings
                    </Button>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="food">
                        <div className="flex justify-center">
                            <TabsList className="h-auto">
                                <TabsTrigger value="food" className="px-6 py-3 text-base">
                                    <Utensils className="mr-2" /> F&B / Restaurants
                                </TabsTrigger>
                                <TabsTrigger value="other" className="px-6 py-3 text-base">
                                    <ConciergeBell className="mr-2" /> Other Hotel Services
                                </TabsTrigger>
                            </TabsList>
                        </div>
                        <TabsContent value="food" className="mt-4">
                             <RestaurantManagement 
                                restaurants={restaurants}
                                onSaveRestaurant={data => {
                                    if (data.id) {
                                        updateRestaurant(data.id, data);
                                    } else {
                                        addRestaurant(data as Omit<Restaurant, 'id'>);
                                    }
                                }}
                                onDeleteRestaurant={id => {
                                    deleteRestaurant(id);
                                }}
                                services={hotelServices}
                                onEditService={handleOpenServiceDialog}
                                onDeleteService={handleDeleteService}
                                onAddExtractedItems={handleAddExtractedItems}
                                onAddService={handleOpenServiceDialog}
                             />
                        </TabsContent>
                        <TabsContent value="other" className="mt-4">
                            <div className="flex justify-end gap-2 mb-4">
                                <Button variant="outline" onClick={() => setIsCategoryDialogOpen(true)}>
                                    <PlusCircle className="mr-2"/>
                                    Add New Category
                                </Button>
                            </div>
                            <ServiceManagementList
                                type="other"
                                services={hotelServices}
                                onEdit={handleOpenServiceDialog}
                                onDelete={handleDeleteService}
                                onDeleteCategory={deleteServiceCategory}
                            />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
            <ServiceTimingsDialog 
                isOpen={isTimingsDialogOpen}
                onClose={() => setIsTimingsDialogOpen(false)}
            />
            <EditServiceDialog
                isOpen={isServiceDialogOpen}
                onClose={handleCloseServiceDialog}
                onSave={handleSaveService}
                service={selectedService}
                dialogType={dialogType}
                restaurantId={currentRestaurantId}
            />
            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Service Category</DialogTitle>
                        <DialogDescription>Create a new category for your non-F&B services.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="category-name">Category Name</Label>
                        <Popover open={isCategoryPopoverOpen} onOpenChange={setIsCategoryPopoverOpen}>
                            <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={isCategoryPopoverOpen}
                                className="w-full justify-between font-normal mt-2"
                            >
                                {newCategoryName ? newCategoryName : "Select or create category..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                                <CommandInput 
                                    placeholder="Search or create category..."
                                    value={newCategoryName}
                                    onValueChange={setNewCategoryName}
                                />
                                <CommandList>
                                    <CommandEmpty>
                                        <div className="p-2 text-sm">No category found. Type to create a new one.</div>
                                    </CommandEmpty>
                                    <CommandGroup>
                                    {availableCategorySuggestions.map((cat) => (
                                        <CommandItem
                                            key={cat}
                                            value={cat}
                                            onSelect={(currentValue) => {
                                                setNewCategoryName(currentValue === newCategoryName ? "" : currentValue);
                                                setIsCategoryPopoverOpen(false);
                                            }}
                                        >
                                            <Check className={cn("mr-2 h-4 w-4", newCategoryName === cat ? "opacity-100" : "opacity-0")} />
                                            {cat}
                                        </CommandItem>
                                    ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveNewCategory}>Add Category</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
