
'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LineChart, Loader2, BarChart } from "lucide-react"
import type { Hotel } from "@/lib/types"
import { cn } from "@/lib/utils"
import Link from 'next/link';

interface FranchiseHotelListTableProps {
  hotels: Hotel[];
  isLoading: boolean;
}

export function FranchiseHotelListTable({ hotels, isLoading }: FranchiseHotelListTableProps) {

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        <p>Loading your hotel portfolio...</p>
      </div>
    );
  }

  if (hotels.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No hotels have been delegated to your account yet.</p>
        <p className="text-sm">Please use the "Request Access" page to get started.</p>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hotel Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {hotels.map((hotel) => (
              <TableRow key={hotel.id}>
                <TableCell className="font-medium">{hotel.name}</TableCell>
                <TableCell>{hotel.location}</TableCell>
                <TableCell>
                  <Badge className={cn(
                      hotel.status === 'Active' ? 'bg-green-500' : 'bg-red-500',
                      "hover:bg-opacity-80"
                  )}>
                    {hotel.status || 'Active'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="outline" size="sm" className="mr-2">
                    <Link href={`/${hotel.id}/dashboard/revenue-analytics`}>
                        <BarChart className="mr-2 h-4 w-4"/> View Analytics
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
