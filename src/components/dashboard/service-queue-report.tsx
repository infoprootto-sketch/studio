
'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ServiceRequest } from "@/lib/types";
import { format } from 'date-fns';
import { Logo } from '../logo';
import { Badge } from '../ui/badge';

interface ServiceQueueReportProps {
  id: string;
  requests: ServiceRequest[];
  hotelName: string;
  filterLabel: string;
  getMemberName: (id?: string) => string;
}

export function ServiceQueueReport({ id, requests, hotelName, filterLabel, getMemberName }: ServiceQueueReportProps) {
  return (
    <div id={id} className="p-4 bg-white text-black print-container">
      <div className="mb-6 flex justify-between items-start border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">{hotelName}</h1>
          <h2 className="text-lg font-semibold text-gray-700">Service Queue Report</h2>
          <p className="text-sm text-gray-500">For: {filterLabel}</p>
        </div>
        <Logo className="size-12" />
      </div>

      <Table className="text-xs">
        <TableHeader>
          <TableRow>
            <TableHead>Requested</TableHead>
            <TableHead>Room</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Completed</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map(req => (
            <TableRow key={req.id}>
              <TableCell>{format(new Date(req.creationTime), 'MMM d, h:mm a')}</TableCell>
              <TableCell>{req.roomNumber}</TableCell>
              <TableCell>{req.service}</TableCell>
              <TableCell>
                <Badge variant="outline">{req.status}</Badge>
              </TableCell>
              <TableCell>{req.staff}</TableCell>
              <TableCell>{req.assignedTo ? getMemberName(req.assignedTo) : 'N/A'}</TableCell>
              <TableCell>{req.completionTime ? format(new Date(req.completionTime), 'MMM d, h:mm a') : '-'}</TableCell>
            </TableRow>
          ))}
          {requests.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No service requests for this period.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

    