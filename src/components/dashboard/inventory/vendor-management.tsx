
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import type { Vendor } from '@/lib/types';
import { VendorList } from './vendor-list';
import { EditVendorDialog } from './edit-vendor-dialog';

interface VendorManagementProps {
  vendors: Vendor[];
  onSave: (vendor: Partial<Vendor>) => void;
  onDelete: (vendorId: string) => void;
}

export function VendorManagement({ vendors, onSave, onDelete }: VendorManagementProps) {
  const [selectedVendor, setSelectedVendor] = useState<Partial<Vendor> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleOpenDialog = (vendor?: Vendor) => {
    setSelectedVendor(vendor || null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedVendor(null);
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => handleOpenDialog()}>
          <PlusCircle className="mr-2" /> Add New Vendor
        </Button>
      </div>
      <VendorList
        vendors={vendors}
        onEdit={handleOpenDialog}
        onDelete={onDelete}
      />
      <EditVendorDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onSave={onSave}
        vendor={selectedVendor}
      />
    </>
  );
}
