
'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { Department, ServiceCategory } from '@/lib/types';
import { EditDepartmentDialog } from './edit-department-dialog';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ReassignDepartmentDialog } from './reassign-department-dialog';
import { useServices } from '@/context/service-context';
import { useTeam } from '@/context/team-context';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';


interface DepartmentManagementProps {
  departments: Department[];
  onSave: (department: Partial<Department>) => void;
  onDelete: (departmentId: string) => void;
  role?: 'admin' | 'manager';
}

export function DepartmentManagement({ departments, onSave, onDelete, role = 'admin' }: DepartmentManagementProps) {
  const [selectedDepartment, setSelectedDepartment] = useState<Partial<Department> | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { serviceCategories, restaurants } = useServices();
  const { teamMembers, reassignMembersAndDeleteDepartment } = useTeam();
  const [reassignState, setReassignState] = useState<{ isOpen: boolean; department: Department | null; memberCount: number }>({ isOpen: false, department: null, memberCount: 0 });

  const handleOpenDialog = (department?: Partial<Department>) => {
    setSelectedDepartment(department || null);
    setIsEditDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsEditDialogOpen(false);
    setSelectedDepartment(null);
  };

  const attemptDelete = (department: Department) => {
    const membersInDept = teamMembers.filter(member => member.department === department.name);
    if (membersInDept.length > 0) {
      setReassignState({ isOpen: true, department: department, memberCount: membersInDept.length });
    } else {
      // Trigger simple delete confirmation if no members are assigned
      onDelete(department.id);
    }
  };
  
  const handleReassignment = (oldDeptName: string, newDeptName: string) => {
    reassignMembersAndDeleteDepartment(oldDeptName, newDeptName);
    setReassignState({ isOpen: false, department: null, memberCount: 0 });
  };
  
  const allManageableCategories = useMemo(() => {
    // Other services (e.g., Laundry, Maintenance)
    const otherServiceCats = serviceCategories.filter(sc => sc.type === 'Other');
    // Restaurants (treated as a manageable F&B category)
    const restaurantCats = restaurants.map(r => ({ id: r.id, name: r.name, type: 'F&B' as const }));
    return [...otherServiceCats, ...restaurantCats];
  }, [serviceCategories, restaurants]);

  return (
    <>
      {role === 'admin' && (
        <div className="flex justify-end mb-4">
          <Button onClick={() => handleOpenDialog()}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Department
          </Button>
        </div>
      )}
       <Accordion type="multiple" className="w-full space-y-2">
        {departments.map((dept) => (
            <AccordionItem value={dept.id} key={dept.id} className="border rounded-lg bg-muted/20">
              <div className="flex items-center px-4">
                <AccordionTrigger className="flex-1 py-4 text-left font-semibold text-lg hover:no-underline">
                  {dept.name}
                </AccordionTrigger>
                {role === 'admin' && (
                  <div className="flex items-center gap-2 pl-4">
                      <Button variant="outline" size="sm" onClick={() => handleOpenDialog(dept)}>
                          <Edit className="mr-2 h-4 w-4"/> Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => attemptDelete(dept)}>
                          <Trash2 className="mr-2 h-4 w-4"/> Delete
                      </Button>
                  </div>
                )}
              </div>
              <AccordionContent className="px-4 pb-4">
                <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-2">Manages Categories:</p>
                    <div className="flex flex-wrap gap-2">
                      {dept.manages.map(category => <Badge key={category} variant="secondary">{category}</Badge>)}
                      {dept.manages.length === 0 && <span className="text-xs text-muted-foreground">No categories assigned.</span>}
                    </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
      </Accordion>

      <EditDepartmentDialog
        isOpen={isEditDialogOpen}
        onClose={handleCloseDialog}
        onSave={onSave}
        department={selectedDepartment}
        allServiceCategories={allManageableCategories}
      />
      <ReassignDepartmentDialog
        isOpen={reassignState.isOpen}
        onClose={() => setReassignState({ isOpen: false, department: null, memberCount: 0 })}
        departmentToDelete={reassignState.department}
        memberCount={reassignState.memberCount}
        allDepartments={departments}
        onConfirm={handleReassignment}
      />
    </>
  );
}
