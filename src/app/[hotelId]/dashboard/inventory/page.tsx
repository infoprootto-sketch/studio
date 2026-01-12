
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { List, AlertTriangle, History, PlusCircle, CheckSquare, Truck } from 'lucide-react';
import type { InventoryItem, StockMovement, Vendor } from '@/lib/types';
import { InventoryList } from '@/components/dashboard/inventory/inventory-list';
import { StockMovementLog } from '@/components/dashboard/inventory/stock-movement-log';
import { LowStockReport } from '@/components/dashboard/inventory/low-stock-report';
import { EditInventoryItemDialog } from '@/components/dashboard/inventory/edit-inventory-item-dialog';
import { UpdateStockDialog } from '@/components/dashboard/inventory/update-stock-dialog';
import { useToast } from '@/hooks/use-toast';
import { CleaningChecklist } from '@/components/dashboard/inventory/cleaning-checklist';
import { VendorManagement } from '@/components/dashboard/inventory/vendor-management';
import { useInventory } from '@/context/inventory-context';
import { useServices } from '@/context/service-context';


export default function InventoryPage() {
  const { 
    inventory,
    stockMovements,
    vendors,
    addInventoryItem, updateInventoryItem, deleteInventoryItem,
    addVendor, updateVendor, deleteVendor,
    addStockMovement
  } = useInventory();
  const { updateHotelService, hotelServices } = useServices();
  const { toast } = useToast();

  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const handleOpenItemDialog = (item?: InventoryItem) => {
    setSelectedItem(item || null);
    setIsItemDialogOpen(true);
  };

  const handleOpenStockDialog = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsStockDialogOpen(true);
  };

  const handleSaveItem = (itemData: Partial<InventoryItem>, linkedServiceId?: string) => {
    let message = '';
    let newId = '';
    if (itemData.id) {
      updateInventoryItem(itemData.id, itemData);
      message = `"${itemData.name}" has been updated.`;
    } else {
      const newItem: Omit<InventoryItem, 'id'> = {
        name: itemData.name!,
        category: itemData.category!,
        stock: itemData.stock!,
        parLevel: itemData.parLevel!,
        unit: itemData.unit!,
      };
      // This is not ideal as we don't get the ID back immediately.
      // For the UI to work, we'll assume a temporary link. A better solution would involve getting the ID after creation.
      newId = `temp-${Date.now()}`;
      addInventoryItem(newItem);
      message = `"${newItem.name}" has been added to the inventory.`;
    }

    if (linkedServiceId) {
        if (linkedServiceId === 'none') {
             // If 'None' was selected, we need to find the service that was previously linked to this item and unlink it.
            const previouslyLinkedService = hotelServices.find(s => s.inventoryItemId === itemData.id);
            if (previouslyLinkedService) {
                updateHotelService(previouslyLinkedService.id, { inventoryItemId: undefined, inventoryQuantityConsumed: undefined });
            }
        } else {
            // Link the new service
            updateHotelService(linkedServiceId, { inventoryItemId: itemData.id || newId });
        }
    }


    toast({ title: 'Inventory Updated', description: message });
  };

  const handleDeleteItem = (itemId: string) => {
    const itemName = inventory.find(i => i.id === itemId)?.name;
    deleteInventoryItem(itemId);
    toast({ title: 'Item Deleted', description: `"${itemName}" has been removed from inventory.`, variant: 'destructive' });
  };

  const handleUpdateStock = (item: InventoryItem, quantityChange: number, type: 'Restock' | 'Consumption' | 'Adjustment', notes?: string) => {
    updateInventoryItem(item.id, { stock: item.stock + quantityChange });
    
    addStockMovement({
      itemId: item.id,
      itemName: item.name,
      type,
      quantity: quantityChange,
      date: new Date(),
      notes,
    });

    toast({ title: 'Stock Updated', description: `Stock for "${item.name}" has been adjusted.` });
  };

  const handleSaveVendor = (vendorData: Partial<Vendor>) => {
    if (vendorData.id) {
        updateVendor(vendorData.id, vendorData);
        toast({ title: 'Vendor Updated', description: `"${vendorData.name}" has been updated.` });
    } else {
        addVendor(vendorData as Omit<Vendor, 'id'>);
        toast({ title: 'Vendor Added', description: `"${vendorData.name}" has been added.` });
    }
  };

  const handleDeleteVendor = (vendorId: string) => {
    const vendorName = vendors.find(v => v.id === vendorId)?.name;
    deleteVendor(vendorId);
    toast({ title: 'Vendor Deleted', description: `"${vendorName}" has been removed.`, variant: 'destructive' });
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Inventory Management</CardTitle>
                <CardDescription>Track and manage your hotel's stock levels and consumption.</CardDescription>
            </div>
            <Button onClick={() => handleOpenItemDialog()}>
                <PlusCircle className="mr-2" /> Add New Item
            </Button>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="inventory-list">
                <div className="flex justify-center">
                    <TabsList className="h-auto flex-wrap">
                        <TabsTrigger value="inventory-list" className="px-4 py-2 text-sm"><List className="mr-2" /> Inventory List</TabsTrigger>
                        <TabsTrigger value="cleaning-checklists" className="px-4 py-2 text-sm"><CheckSquare className="mr-2" /> Cleaning Checklists</TabsTrigger>
                        <TabsTrigger value="low-stock" className="px-4 py-2 text-sm"><AlertTriangle className="mr-2" /> Low Stock Alerts</TabsTrigger>
                        <TabsTrigger value="vendors" className="px-4 py-2 text-sm"><Truck className="mr-2" /> Vendors</TabsTrigger>
                        <TabsTrigger value="stock-log" className="px-4 py-2 text-sm"><History className="mr-2" /> Stock Movement Log</TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value="inventory-list" className="mt-4">
                    <InventoryList 
                        inventory={inventory}
                        onEditItem={handleOpenItemDialog}
                        onDeleteItem={handleDeleteItem}
                        onUpdateStock={handleOpenStockDialog}
                    />
                </TabsContent>
                <TabsContent value="cleaning-checklists" className="mt-4">
                    <CleaningChecklist 
                        inventoryItems={inventory}
                    />
                </TabsContent>
                 <TabsContent value="low-stock" className="mt-4">
                    <LowStockReport
                        inventory={inventory}
                        onUpdateStock={handleOpenStockDialog}
                    />
                </TabsContent>
                <TabsContent value="vendors" className="mt-4">
                    <VendorManagement
                        vendors={vendors}
                        onSave={handleSaveVendor}
                        onDelete={handleDeleteVendor}
                    />
                </TabsContent>
                <TabsContent value="stock-log" className="mt-4">
                    <StockMovementLog stockMovements={stockMovements} />
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>

      <EditInventoryItemDialog
        isOpen={isItemDialogOpen}
        onClose={() => setIsItemDialogOpen(false)}
        onSave={handleSaveItem}
        item={selectedItem}
      />

      <UpdateStockDialog
        isOpen={isStockDialogOpen}
        onClose={() => setIsStockDialogOpen(false)}
        item={selectedItem}
        onConfirm={handleUpdateStock}
      />
    </div>
  )
}
