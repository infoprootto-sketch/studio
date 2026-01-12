
'use client';

import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Utensils, ConciergeBell } from 'lucide-react';
import type { ServiceCategory, Restaurant } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface UnifiedCategory {
  id: string;
  name: string;
  slaMinutes?: number;
  type: 'F&B' | 'Other';
}

interface SlaManagementProps {
  categories: UnifiedCategory[];
  onUpdate: (id: string, name: string, slaMinutes: number, type: 'F&B' | 'Other') => void;
  role?: 'admin' | 'manager';
}

export function SlaManagement({ categories, onUpdate, role = 'admin' }: SlaManagementProps) {
  const [localSlaValues, setLocalSlaValues] = useState<Record<string, number | ''>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (categories) {
        const initialValues: Record<string, number | ''> = {};
        categories.forEach(cat => {
            initialValues[cat.id] = cat.slaMinutes || '';
        });
        setLocalSlaValues(initialValues);
    }
  }, [categories]);

  const handleInputChange = (id: string, value: string) => {
    setLocalSlaValues(prev => ({
      ...prev,
      [id]: value === '' ? '' : Number(value),
    }));
  };

  const handleSaveAll = () => {
    if (!categories) return;
    Object.entries(localSlaValues).forEach(([id, slaMinutes]) => {
      const category = categories.find(c => c.id === id);
      if (category && (slaMinutes || slaMinutes === 0)) {
        onUpdate(id, category.name, Number(slaMinutes), category.type);
      }
    });
    toast({
      title: 'SLA Rules Updated',
      description: 'The time limits for your service categories have been saved.',
    });
  };

  if (!categories) {
    return <p className="text-muted-foreground text-center py-4">Loading categories...</p>;
  }

  return (
    <>
      {role === 'admin' && (
        <div className="flex justify-end mb-4">
          <Button onClick={handleSaveAll}>
            <Save className="mr-2" />
            Save All Changes
          </Button>
        </div>
      )}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service Category / Restaurant</TableHead>
              <TableHead className="w-[200px]">Time Limit (Minutes)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {cat.type === 'F&B' ? <Utensils className="size-4 text-muted-foreground" /> : <ConciergeBell className="size-4 text-muted-foreground" />}
                    {cat.name}
                  </div>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    placeholder="e.g., 30"
                    value={localSlaValues[cat.id] ?? ''}
                    onChange={e => handleInputChange(cat.id, e.target.value)}
                    readOnly={role !== 'admin'}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
         {categories.length === 0 && (
            <div className="text-center p-8 text-muted-foreground">
                No service categories or restaurants found.
            </div>
        )}
      </div>
    </>
  );
}
