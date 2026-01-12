'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AlertTriangle, PackagePlus } from 'lucide-react';
import type { InventoryItem } from '@/lib/types';

interface LowStockReportProps {
  inventory: InventoryItem[];
  onUpdateStock: (item: InventoryItem) => void;
}

export function LowStockReport({ inventory, onUpdateStock }: LowStockReportProps) {
  const lowStockItems = inventory.filter(item => item.stock < item.parLevel);

  if (lowStockItems.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>All items are sufficiently stocked.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-yellow-500/10 border-yellow-500/30">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-yellow-900 dark:text-yellow-300">Item Name</TableHead>
            <TableHead className="text-yellow-900 dark:text-yellow-300">Current Stock</TableHead>
            <TableHead className="text-yellow-900 dark:text-yellow-300">Par Level</TableHead>
            <TableHead className="text-right text-yellow-900 dark:text-yellow-300">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lowStockItems.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell className="text-red-500 font-bold">{item.stock} {item.unit}</TableCell>
              <TableCell>{item.parLevel} {item.unit}</TableCell>
              <TableCell className="text-right">
                <Button size="sm" onClick={() => onUpdateStock(item)}>
                  <PackagePlus className="mr-2" /> Restock
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
