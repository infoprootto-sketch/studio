
'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { CorporateClient } from '@/lib/types';
import { Edit, Trash2, History } from 'lucide-react';

interface CorporateClientListProps {
  clients: CorporateClient[];
  onEdit: (client: CorporateClient) => void;
  onDelete: (clientId: string) => void;
  onViewHistory: (client: CorporateClient) => void;
}

export function CorporateClientList({ clients, onEdit, onDelete, onViewHistory }: CorporateClientListProps) {
  if (clients.length === 0) {
      return <p className="text-center text-muted-foreground py-8">No corporate clients have been added yet.</p>
  }
  
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company Name</TableHead>
            <TableHead>Contact Person</TableHead>
            <TableHead>GST Number</TableHead>
            <TableHead>Pending Bills</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id}>
              <TableCell className="font-medium">{client.name}</TableCell>
              <TableCell>{client.contactPerson}</TableCell>
              <TableCell className="text-muted-foreground font-mono text-xs">{client.gstNumber}</TableCell>
              <TableCell>
                {client.billedOrders?.filter(o => o.status === 'Pending').length || 0}
              </TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm" className="mr-2" onClick={() => onViewHistory(client)}>
                  <History className="mr-2 h-4 w-4"/> View History
                </Button>
                <Button variant="outline" size="sm" className="mr-2" onClick={() => onEdit(client)}>
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
                        This will permanently delete the client "{client.name}" and all associated billing history. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(client.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
