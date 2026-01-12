
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { RoomCategory } from '@/lib/types';
import { EditRoomCategoryDialog } from './edit-room-category-dialog';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useSettings } from '@/context/settings-context';
import { useRooms } from '@/context/room-context';
import { Badge } from '../ui/badge';


interface RoomCategoryManagementProps {
  categories: RoomCategory[];
  onAddCategory: (category: Omit<RoomCategory, 'id'>) => void;
  onUpdateCategory: (id: string, category: Partial<RoomCategory>) => void;
  onDeleteCategory: (id: string) => void;
}

export function RoomCategoryManagement({ categories, onAddCategory, onUpdateCategory, onDeleteCategory }: RoomCategoryManagementProps) {
  const [selectedCategory, setSelectedCategory] = useState<Partial<RoomCategory> | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { toast } = useToast();
  const { formatPrice } = useSettings();
  const { rooms } = useRooms();

  const handleOpenSheet = (category?: Partial<RoomCategory>) => {
    setSelectedCategory(category || null);
    setIsSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setIsSheetOpen(false);
    setSelectedCategory(null);
  };

  const handleSaveCategory = (categoryData: Partial<RoomCategory>) => {
    if (categoryData.id) {
      onUpdateCategory(categoryData.id, categoryData);
      toast({
        title: "Category Updated",
        description: `The category "${categoryData.name}" has been updated.`,
      });
    } else {
      const newCategory: Omit<RoomCategory, 'id'> = {
        name: categoryData.name!,
        description: categoryData.description!,
        basePrice: categoryData.basePrice!,
        quickDiscounts: categoryData.quickDiscounts || [],
        cleaningConsumables: categoryData.cleaningConsumables || [],
      };
      onAddCategory(newCategory);
      toast({
        title: "Category Added",
        description: `The category "${newCategory.name}" has been created.`,
      });
    }
    handleCloseSheet();
  };

  const handleDeleteCategory = (categoryId: string) => {
    onDeleteCategory(categoryId);
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => handleOpenSheet()} id="add-category-btn">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Category
        </Button>
      </div>
      
      <Accordion type="multiple" className="w-full space-y-2">
        {categories.map((category) => {
          const roomCount = rooms.filter(r => r.type === category.name).length;
          return (
            <AccordionItem value={category.id} key={category.id} className="border rounded-lg bg-muted/20">
              <AccordionTrigger className="px-4 py-2 hover:no-underline">
                <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                        <p className="font-bold">{category.name}</p>
                        <Badge variant="secondary">{roomCount} {roomCount === 1 ? 'room' : 'rooms'}</Badge>
                    </div>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>
                <div className="font-semibold text-lg px-4">{formatPrice(category.basePrice)}</div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="flex items-center justify-end gap-2 border-t pt-4">
                    <Button variant="outline" size="sm" onClick={() => handleOpenSheet(category)}>
                        <Edit className="mr-2 h-4 w-4"/> Edit
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                            <Trash2 className="mr-2 h-4 w-4"/> Delete
                        </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                            This will permanently delete the "{category.name}" category. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteCategory(category.id)}>
                            Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
            <SheetHeader>
                <SheetTitle>{selectedCategory?.id ? 'Edit Room Category' : 'Add New Room Category'}</SheetTitle>
                <SheetDescription>
                    {selectedCategory?.id ? `Update the details for the "${selectedCategory?.name}" category.` : 'Enter the details for the new room category.'}
                </SheetDescription>
            </SheetHeader>
            <EditRoomCategoryDialog
                category={selectedCategory}
                onSave={handleSaveCategory}
                onClose={handleCloseSheet}
            />
        </SheetContent>
      </Sheet>
    </>
  );
}
