
'use client';

import React, { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { PlusCircle, Utensils, Edit, Trash2, Tag, X, Check } from 'lucide-react';
import { MenuExtractor } from './menu-extractor';
import { ServiceManagementList } from './service-management-list';
import type { HotelService, Restaurant } from '@/lib/types';
import { EditRestaurantDialog } from './edit-restaurant-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { buttonVariants } from '../ui/button';
import { cn } from '@/lib/utils';
import { useServices } from '@/context/service-context';
import { ReassignCategoryDialog } from './reassign-category-dialog';

interface RestaurantManagementProps {
  restaurants: Restaurant[];
  onSaveRestaurant: (restaurant: Partial<Restaurant>) => void;
  onDeleteRestaurant: (restaurantId: string) => void;
  services: HotelService[];
  onAddService: (service: Partial<HotelService> | undefined, type: 'food', restaurantId: string) => void;
  onEditService: (service: Partial<HotelService>, type: 'food') => void;
  onDeleteService: (serviceId: string) => void;
  onAddExtractedItems: (items: HotelService[], restaurantId: string) => void;
}

export function RestaurantManagement({
  restaurants,
  onSaveRestaurant,
  onDeleteRestaurant,
  services,
  onAddService,
  onEditService,
  onDeleteService,
  onAddExtractedItems,
}: RestaurantManagementProps) {
  const [isRestaurantDialogOpen, setIsRestaurantDialogOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Partial<Restaurant> | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const { reassignAndRemoveCategory, editRestaurantCategory } = useServices();

  const [editingCategory, setEditingCategory] = useState<{ restaurantId: string; categoryName: string } | null>(null);
  const [editingCategoryValue, setEditingCategoryValue] = useState('');

  const [reassignState, setReassignState] = useState<{
    isOpen: boolean;
    restaurant: Restaurant | null;
    categoryToDelete: string | null;
    itemCount: number;
  }>({ isOpen: false, restaurant: null, categoryToDelete: null, itemCount: 0 });

  const { toast } = useToast();

  const handleOpenRestaurantDialog = (restaurant?: Restaurant) => {
    setSelectedRestaurant(restaurant || null);
    setIsRestaurantDialogOpen(true);
  };

  const handleCloseRestaurantDialog = () => {
    setIsRestaurantDialogOpen(false);
    setSelectedRestaurant(null);
  };

  const handleSaveRestaurant = (data: Partial<Restaurant>) => {
    onSaveRestaurant(data);
    handleCloseRestaurantDialog();
  };

  const handleDeleteRestaurant = (restaurantId: string) => {
    onDeleteRestaurant(restaurantId);
    toast({
      title: "Restaurant Deleted",
      variant: 'destructive',
    });
  };

  const handleAddCategory = (restaurantId: string) => {
    if (!newCategoryName.trim()) return;
    const restaurant = restaurants.find(r => r.id === restaurantId);
    if (!restaurant) return;
    
    const updatedCategories = [...(restaurant.categories || []), newCategoryName.trim()];
    onSaveRestaurant({ id: restaurantId, categories: updatedCategories });
    setNewCategoryName('');
  };

  const attemptDeleteCategory = (restaurant: Restaurant, categoryToDelete: string) => {
    const itemsInCategory = services.filter(
      s => s.restaurantId === restaurant.id && s.category.replace('F&B:', '') === categoryToDelete
    ).length;

    if (itemsInCategory > 0) {
        setReassignState({
            isOpen: true,
            restaurant: restaurant,
            categoryToDelete: categoryToDelete,
            itemCount: itemsInCategory,
        });
    } else {
        const updatedCategories = (restaurant.categories || []).filter(c => c !== categoryToDelete);
        onSaveRestaurant({ id: restaurant.id, categories: updatedCategories });
        toast({ title: 'Category Deleted', description: `Category "${categoryToDelete}" was empty and has been removed.` });
    }
  };

  const handleReassignment = (restaurantId: string, oldCategory: string, newCategory: string) => {
    reassignAndRemoveCategory(restaurantId, oldCategory, newCategory);
    setReassignState({ isOpen: false, restaurant: null, categoryToDelete: null, itemCount: 0 });
    toast({
      title: 'Category Re-assigned & Deleted',
      description: `Items from "${oldCategory}" have been moved to "${newCategory}".`,
    });
  };

  const handleStartEditCategory = (restaurantId: string, categoryName: string) => {
    setEditingCategory({ restaurantId, categoryName });
    setEditingCategoryValue(categoryName);
  };

  const handleCancelEditCategory = () => {
    setEditingCategory(null);
    setEditingCategoryValue('');
  };

  const handleSaveCategoryEdit = () => {
    if (!editingCategory || !editingCategoryValue.trim()) {
        handleCancelEditCategory();
        return;
    }
    
    if (editingCategory.categoryName === editingCategoryValue.trim()) {
        handleCancelEditCategory();
        return;
    }
    
    editRestaurantCategory(editingCategory.restaurantId, editingCategory.categoryName, editingCategoryValue.trim());
    toast({ title: "Category Updated", description: `Category "${editingCategory.categoryName}" has been renamed to "${editingCategoryValue.trim()}".` });
    handleCancelEditCategory();
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => handleOpenRestaurantDialog()}>
          <PlusCircle className="mr-2" />
          Add New Restaurant
        </Button>
      </div>

      <Accordion type="multiple" className="w-full space-y-4">
        {restaurants && restaurants.map(restaurant => (
          <AccordionItem value={restaurant.id} key={restaurant.id} className="border-none">
            <div className="border rounded-lg">
                <div className="flex items-center p-4">
                    <AccordionTrigger className="hover:no-underline flex-1 text-left">
                        <div className="flex items-center gap-3">
                            <Utensils className="size-5 text-primary" />
                            <span className="font-bold text-lg">{restaurant.name}</span>
                        </div>
                    </AccordionTrigger>
                    <div className="flex items-center gap-2 pl-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenRestaurantDialog(restaurant)}>
                            <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete the restaurant "{restaurant.name}". Associated menu items will not be deleted but will become unassigned.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteRestaurant(restaurant.id)}>
                                Delete
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
              <AccordionContent className="p-4 pt-0">
                <div className="space-y-6">
                  <Accordion type="single" collapsible className="space-y-2">
                    <AccordionItem value="categories" className="border rounded-md px-4">
                        <AccordionTrigger className="w-full justify-between hover:no-underline font-semibold p-4">Manage Categories</AccordionTrigger>
                        <AccordionContent className="pt-2">
                            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                                <div className="flex flex-wrap gap-2">
                                    {(restaurant.categories || []).map(cat => {
                                        const isEditingThis = editingCategory?.restaurantId === restaurant.id && editingCategory?.categoryName === cat;
                                        if (isEditingThis) {
                                            return (
                                                <div key={cat} className="flex items-center gap-1">
                                                    <Input
                                                        value={editingCategoryValue}
                                                        onChange={(e) => setEditingCategoryValue(e.target.value)}
                                                        className="h-8"
                                                        autoFocus
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleSaveCategoryEdit();
                                                            if (e.key === 'Escape') handleCancelEditCategory();
                                                        }}
                                                    />
                                                    <Button size="icon" className="h-8 w-8" onClick={handleSaveCategoryEdit}><Check className="size-4" /></Button>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancelEditCategory}><X className="size-4" /></Button>
                                                </div>
                                            )
                                        }
                                        return (
                                            <Badge key={cat} variant="secondary" className="text-base py-1 pl-3 pr-1 group/badge whitespace-nowrap">
                                                {cat}
                                                <div className="flex items-center opacity-0 group-hover/badge:opacity-100 transition-opacity">
                                                    <button onClick={() => handleStartEditCategory(restaurant.id, cat)} className="ml-2 rounded-full p-0.5 hover:bg-background/50">
                                                        <Edit className="size-3" />
                                                    </button>
                                                    <button onClick={() => attemptDeleteCategory(restaurant, cat)} className="ml-1 rounded-full p-0.5 hover:bg-destructive/20 text-destructive">
                                                        <X className="size-3" />
                                                    </button>
                                                </div>
                                            </Badge>
                                        )
                                    })}
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Input 
                                        placeholder="New category name..."
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddCategory(restaurant.id)}
                                    />
                                    <Button onClick={() => handleAddCategory(restaurant.id)}>Add</Button>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="ai-extractor" className="border rounded-md px-4">
                      <AccordionTrigger className="w-full justify-between hover:no-underline font-semibold p-4">AI Menu Extractor</AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <MenuExtractor onAddItems={onAddExtractedItems} restaurants={[restaurant]} />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  <div className="flex justify-end">
                    <Button onClick={() => onAddService(undefined, 'food', restaurant.id)}>
                      <PlusCircle className="mr-2" />
                      Add New Menu Item
                    </Button>
                  </div>
                  
                  <ServiceManagementList
                    type="food"
                    services={services}
                    onEdit={(service) => onEditService(service, 'food')}
                    onDelete={onDeleteService}
                    restaurantId={restaurant.id}
                    onDeleteCategory={(catId) => {/* This is now handled by attemptDeleteCategory */}}
                  />
                </div>
              </AccordionContent>
            </div>
          </AccordionItem>
        ))}
      </Accordion>

      <EditRestaurantDialog
        isOpen={isRestaurantDialogOpen}
        onClose={handleCloseRestaurantDialog}
        onSave={handleSaveRestaurant}
        restaurant={selectedRestaurant}
      />
      
      <ReassignCategoryDialog
        isOpen={reassignState.isOpen}
        onClose={() => setReassignState({ isOpen: false, restaurant: null, categoryToDelete: null, itemCount: 0 })}
        restaurant={reassignState.restaurant}
        categoryToDelete={reassignState.categoryToDelete}
        itemCount={reassignState.itemCount}
        onConfirm={handleReassignment}
      />
    </>
  );
}
