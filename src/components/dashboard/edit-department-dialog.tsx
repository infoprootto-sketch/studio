
'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { Department, ServiceCategory } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface EditDepartmentDialogProps {
  department: Partial<Department> | null;
  allServiceCategories: Pick<ServiceCategory, 'id' | 'name'>[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (department: Partial<Department>) => void;
}

export function EditDepartmentDialog({ department, allServiceCategories, isOpen, onClose, onSave }: EditDepartmentDialogProps) {
  const [name, setName] = useState('');
  const [manages, setManages] = useState<string[]>([]);
  const { toast } = useToast();

  const isEditing = department && department.id;

  useEffect(() => {
    if (isOpen) {
      if (department) {
        setName(department.name || '');
        setManages(department.manages || []);
      } else {
        setName('');
        setManages([]);
      }
    }
  }, [department, isOpen]);

  const handleSave = () => {
    if (!name) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide a name for the department.",
      });
      return;
    }

    onSave({ id: department?.id, name, manages });
    onClose();
  };

  const handleCategoryToggle = (categoryName: string) => {
    setManages(prev => 
      prev.includes(categoryName) 
        ? prev.filter(c => c !== categoryName)
        : [...prev, categoryName]
    );
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Department' : 'Add New Department'}</DialogTitle>
          <DialogDescription>
            {isEditing ? `Update the details for the "${department?.name}" department.` : 'Create a new team and assign the service categories it will manage.'}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="department-name">Department Name</Label>
            <Input id="department-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., IT Support" />
          </div>
          <div className="space-y-2">
            <Label>Manages Service Categories</Label>
            <div className="p-4 border rounded-md grid grid-cols-2 gap-4">
                {allServiceCategories.map(category => (
                    <div key={category.id} className="flex items-center space-x-2">
                        <Checkbox
                            id={`cat-${category.id}`}
                            checked={manages.includes(category.name)}
                            onCheckedChange={() => handleCategoryToggle(category.name)}
                        />
                        <Label htmlFor={`cat-${category.id}`} className="font-normal">{category.name}</Label>
                    </div>
                ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>
            {isEditing ? 'Save Changes' : 'Add Department'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
