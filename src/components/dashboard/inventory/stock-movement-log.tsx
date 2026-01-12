
'use client';

import React, { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { StockMovement } from '@/lib/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface StockMovementLogProps {
  stockMovements: StockMovement[];
}

const movementTypeColors: Record<StockMovement['type'], string> = {
  'Restock': 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30',
  'Consumption': 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30',
  'Adjustment': 'bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/30',
};

export function StockMovementLog({ stockMovements }: StockMovementLogProps) {

  const sortedMovements = useMemo(() => {
    return [...stockMovements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [stockMovements]);

  if (sortedMovements.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No stock movements have been recorded yet.</p>;
  }

  return (
    <ScrollArea className="h-96 border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date & Time</TableHead>
            <TableHead>Item</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedMovements.map((movement) => (
            <TableRow key={movement.id}>
              <TableCell className="text-xs text-muted-foreground">
                {format(movement.date, 'MMM d, yyyy, hh:mm a')}
              </TableCell>
              <TableCell className="font-medium">{movement.itemName}</TableCell>
              <TableCell>
                <Badge variant="outline" className={cn(movementTypeColors[movement.type])}>
                  {movement.type}
                </Badge>
              </TableCell>
              <TableCell className={cn(movement.quantity > 0 ? 'text-green-600' : 'text-red-600')}>
                {movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">{movement.notes}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
