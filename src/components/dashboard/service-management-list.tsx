
'use client';

import React, { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { HotelService, ServiceCategory } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { useSettings } from '@/context/settings-context';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useServices } from '@/context/service-context';
import { useToast } from '@/hooks/use-toast';
import { ReassignOrDeleteServiceCategoryDialog } from './reassign-or-delete-service-category-dialog';

interface ServiceManagementListProps {
    type: 'food' | 'other';
    services: HotelService[];
    onEdit: (service: Partial<HotelService>, type: 'food' | 'other', restaurantId?: string) => void;
    onDelete: (serviceId: string) => void;
    onDeleteCategory: (categoryId: string) => void;
    restaurantId?: string;
}

export function ServiceManagementList({ type, services, onEdit, onDelete, onDeleteCategory, restaurantId }: ServiceManagementListProps) {
  const { formatPrice } = useSettings();
  const { serviceCategories, deleteServicesByCategory, reassignServicesToCategory } = useServices();
  const { toast } = useToast();
  
  const [reassignState, setReassignState] = useState<{
    isOpen: boolean;
    category: ServiceCategory | null;
    itemCount: number;
  }>({ isOpen: false, category: null, itemCount: 0 });

  const groupedServices = useMemo(() => {
    let servicesToFilter = services;

    if (type === 'food') {
        if (!restaurantId) return {};
        servicesToFilter = services.filter(s => s.restaurantId === restaurantId);
    } else {
        servicesToFilter = services.filter(s => !s.restaurantId);
    }
    
    return servicesToFilter.reduce((acc, service) => {
      const category = service.category.startsWith('F&B:') ? service.category.substring(4) : service.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(service);
      return acc;
    }, {} as Record<string, HotelService[]>);
  }, [services, type, restaurantId]);

  const displayPrice = (price: number, discount?: number) => {
    if (discount && discount > 0) {
      const discountedPrice = price * (1 - discount / 100);
      return (
        <div className="flex flex-col">
          <span className="text-red-500">{formatPrice(discountedPrice)}</span>
          <span className="text-xs text-muted-foreground line-through">{formatPrice(price)}</span>
        </div>
      );
    }
    if (price === 0) return <Badge variant="outline">Free</Badge>;
    return formatPrice(price);
  };
  
  const categories = useMemo(() => {
    if (type === 'food') {
        const restaurantServices = services.filter(s => s.restaurantId === restaurantId);
        const restaurantCategories = new Set(restaurantServices.map(s => s.category.startsWith('F&B:') ? s.category.substring(4) : s.category));
        return Array.from(restaurantCategories).map(name => ({ id: name, name, type: 'F&B'}) as ServiceCategory);
    }
    return serviceCategories.filter(cat => cat.type === 'Other');
  }, [services, type, restaurantId, serviceCategories]);

  const attemptDeleteCategory = (category: ServiceCategory) => {
    const itemsInCategory = groupedServices[category.name] || [];
    if (itemsInCategory.length > 0) {
      setReassignState({ isOpen: true, category: category, itemCount: itemsInCategory.length });
    } else {
      onDeleteCategory(category.id);
      toast({ title: 'Category Deleted', description: `Category "${category.name}" was empty and has been removed.` });
    }
  };

  const handleReassignConfirm = (action: 'reassign' | 'delete', oldCategory: ServiceCategory, newCategoryName?: string) => {
    if (action === 'delete') {
      deleteServicesByCategory(oldCategory.name);
      onDeleteCategory(oldCategory.id);
      toast({
        title: `Category and Services Deleted`,
        description: `The "${oldCategory.name}" category and all its services have been permanently deleted.`,
        variant: "destructive"
      });
    } else if (action === 'reassign' && newCategoryName) {
      reassignServicesToCategory(oldCategory.name, newCategoryName);
      onDeleteCategory(oldCategory.id);
      toast({
        title: `Services Re-assigned`,
        description: `Services from "${oldCategory.name}" have been moved to "${newCategoryName}".`,
      });
    }
    setReassignState({ isOpen: false, category: null, itemCount: 0 });
  };


  if (type === 'other' && categories.length === 0) {
      return <p className="text-sm text-muted-foreground py-4 text-center">No service categories created yet. Click "Add New Category" to start.</p>
  }
  
  const renderSubCategory = (subCategoryName: string, servicesInSubCategory: HotelService[]) => {
    return (
      <div key={subCategoryName} className={subCategoryName !== 'General' ? "ml-4 pl-4 border-l-2" : ""}>
        {subCategoryName !== 'General' && <h4 className="font-semibold text-md mb-2">{subCategoryName}</h4>}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="w-[120px]">Discount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {servicesInSubCategory.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">
                    <div>{service.name}</div>
                    {service.description && <p className="text-xs text-muted-foreground">{service.description}</p>}
                  </TableCell>
                  <TableCell>{displayPrice(service.price, service.discount)}</TableCell>
                  <TableCell>
                    {service.discount ? (
                      <Badge variant="destructive">{service.discount}% off</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">None</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="mr-2" onClick={() => onEdit(service, type, service.restaurantId)}>
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">Delete</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the service: "{service.name}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDelete(service.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  const renderCategoryContent = (category: ServiceCategory) => {
    const servicesInCategory = groupedServices[category.name] || [];
    const groupedBySubcategory = servicesInCategory.reduce((acc, service) => {
        const subCat = service.subcategory || 'General';
        if (!acc[subCat]) {
            acc[subCat] = [];
        }
        acc[subCat].push(service);
        return acc;
    }, {} as Record<string, HotelService[]>);

    const hasSubcategories = Object.keys(groupedBySubcategory).length > 1 || (Object.keys(groupedBySubcategory).length === 1 && !groupedBySubcategory['General']);

    if (servicesInCategory.length === 0 && type === 'other') return (
        <div className="text-center text-sm text-muted-foreground p-4">
            No services in this category yet.
        </div>
    );
    
    if (!hasSubcategories) {
        return renderSubCategory('General', servicesInCategory);
    }

    return (
      <div className="space-y-4">
        {Object.entries(groupedBySubcategory).map(([subCategoryName, servicesInSub]) => (
            renderSubCategory(subCategoryName, servicesInSub)
        ))}
      </div>
    );
  }

  if (type === 'other') {
      return (
        <>
          <Accordion type="multiple" className="w-full space-y-2">
              {categories.map(category => (
                  <AccordionItem value={category.id} key={category.id} className="border-b-0">
                      <div className="border rounded-lg overflow-hidden">
                          <div className="flex items-center p-4 bg-muted/50">
                            <AccordionTrigger className="flex-1 hover:no-underline p-0">
                                <h3 className="text-base font-semibold">{category.name}</h3>
                            </AccordionTrigger>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => attemptDeleteCategory(category)}>
                                <Trash2 className="size-4" />
                            </Button>
                          </div>
                          <AccordionContent className="p-4">
                            <div className="space-y-4">
                                <div className="flex justify-end">
                                    <Button size="sm" onClick={() => onEdit({ category: category.name }, 'other')}>
                                        <PlusCircle className="mr-2 h-4 w-4" /> Add Service
                                    </Button>
                                </div>
                                {renderCategoryContent(category)}
                            </div>
                          </AccordionContent>
                      </div>
                  </AccordionItem>
              ))}
          </Accordion>
          <ReassignOrDeleteServiceCategoryDialog
            isOpen={reassignState.isOpen}
            onClose={() => setReassignState({ isOpen: false, category: null, itemCount: 0 })}
            categoryToDelete={reassignState.category}
            itemCount={reassignState.itemCount}
            allCategories={categories}
            onConfirm={handleReassignConfirm}
          />
        </>
      )
  }

  // This is for F&B type
  return (
    <div className="space-y-6">
      {categories.map((category) => (
        <div key={category.id}>
          <h3 className="text-base font-semibold mb-2">{category.name}</h3>
          {renderCategoryContent(category)}
        </div>
      ))}
    </div>
  );
}
