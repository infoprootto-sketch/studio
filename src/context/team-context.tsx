

'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import type { TeamMember, Department, Shift, SlaRule, AttendanceRecord, Hotel } from '@/lib/types';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { useHotelId } from './hotel-id-context';
import { collection, doc, writeBatch, runTransaction, getDoc, query, where, increment } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { createUserWithEmailAndPassword } from 'firebase/auth';

interface TeamContextType {
  teamMembers: TeamMember[];
  departments: Department[];
  shifts: Shift[];
  slaRules: SlaRule[];
  addDepartment: (department: Omit<Department, 'id'>) => void;
  updateDepartment: (departmentId: string, updates: Partial<Department>) => void;
  deleteDepartment: (departmentId: string) => void;
  addShift: (shift: Omit<Shift, 'id'>) => void;
  updateShift: (shiftId: string, updates: Partial<Shift>) => void;
  deleteShift: (shiftId: string) => void;
  addSlaRule: (ruleData: Omit<SlaRule, 'id'>) => void;
  updateSlaRule: (ruleId: string, updates: Partial<SlaRule>) => void;
  deleteSlaRule: (ruleId: string) => void;
  saveTeamMember: (memberData: Partial<TeamMember>, password?: string) => Promise<boolean>;
  deleteTeamMember: (memberId: string) => Promise<boolean>;
  reassignMembersAndDeleteDepartment: (oldDeptName: string, newDeptName: string) => void;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

const toDate = (value: any): Date | undefined => {
    if (!value) return undefined;
    if (value.toDate) return value.toDate();
    return new Date(value);
};


export function TeamProvider({ children }: { children: ReactNode }) {
  const firestore = useFirestore();
  const hotelId = useHotelId();
  const { user, auth, isUserLoading } = useUser();

  const teamMembersCollectionRef = useMemoFirebase(() => {
    if (firestore && hotelId && user && !isUserLoading) {
      return collection(firestore, 'hotels', hotelId, 'teamMembers');
    }
    return null;
  }, [firestore, hotelId, user, isUserLoading]);


  const departmentsCollectionRef = useMemoFirebase(() => (firestore && hotelId && user && !isUserLoading ? collection(firestore, 'hotels', hotelId, 'departments') : null), [firestore, hotelId, user, isUserLoading]);
  const shiftsCollectionRef = useMemoFirebase(() => (firestore && hotelId && user && !isUserLoading ? collection(firestore, 'hotels', hotelId, 'shifts') : null), [firestore, hotelId, user, isUserLoading]);
  const slaRulesCollectionRef = useMemoFirebase(() => (firestore && hotelId && user && !isUserLoading ? collection(firestore, 'hotels', hotelId, 'slaRules') : null), [firestore, hotelId, user, isUserLoading]);

  const { data: rawTeamMembers = [] } = useCollection<TeamMember>(teamMembersCollectionRef);
  const { data: departments = [] } = useCollection<Department>(departmentsCollectionRef);
  const { data: shifts = [] } = useCollection<Shift>(shiftsCollectionRef);
  const { data: slaRules = [] } = useCollection<SlaRule>(slaRulesCollectionRef);

  const teamMembers = useMemo(() => {
    return (rawTeamMembers || []).map(member => ({
        ...member,
        lastClockIn: member.lastClockIn ? toDate(member.lastClockIn) : undefined,
        attendanceHistory: (member.attendanceHistory || []).map(record => ({
            ...record,
            date: toDate(record.date)!,
            clockIn: toDate(record.clockIn)!,
            clockOut: record.clockOut ? toDate(record.clockOut) : null,
        })) as AttendanceRecord[],
    }));
  }, [rawTeamMembers]);

  const saveTeamMember = async (memberData: Partial<TeamMember>, password?: string): Promise<boolean> => {
    if (!firestore || !hotelId) return false;
    
    // Handle editing an existing member
    if (memberData.id) {
        const memberRef = doc(firestore, 'hotels', hotelId, 'teamMembers', memberData.id);
        updateDocumentNonBlocking(memberRef, { ...memberData, restaurantId: memberData.restaurantId || null });
        return true;
    }

    // Handle new member creation
    if (!memberData.id && password && memberData.email) {
      if (!auth || !user) {
          console.error("Auth service is not available or admin is not logged in.");
          return false;
      }
      const adminUid = user.uid; // Capture the UID of the admin performing the action.

      try {
        // This will sign in the new user, changing the auth context.
        const userCredential = await createUserWithEmailAndPassword(auth, memberData.email, password);
        const newUserId = userCredential.user.uid;

        const memberRef = doc(firestore, 'hotels', hotelId, 'teamMembers', newUserId);
        const newMember = {
            name: memberData.name!,
            email: memberData.email!,
            department: memberData.department!,
            role: memberData.role!,
            shiftId: memberData.shiftId!,
            attendanceStatus: 'Clocked Out' as const,
            restaurantId: memberData.restaurantId || null,
            creatorId: adminUid, // Embed the admin's UID for security rule validation.
        };

        // Use setDoc directly. This is executed by the new user. The new security rule will permit this.
        await setDocumentNonBlocking(memberRef, newMember, {});
        
        // The hotel document counts can no longer be updated here due to permissions.
        // A background sync or periodic job is now responsible for ensuring count accuracy.

        return true;
      } catch (e: any) {
         console.error("New member creation failed:", e);
         return false;
      }
    }

    return false;
  };
  
  const deleteTeamMember = async (memberId: string): Promise<boolean> => {
      if (!firestore || !hotelId) return false;
      const memberRef = doc(firestore, 'hotels', hotelId, 'teamMembers', memberId);
      const hotelRef = doc(firestore, 'hotels', hotelId);

      try {
          await runTransaction(firestore, async (transaction) => {
              const memberDoc = await transaction.get(memberRef);
              if (!memberDoc.exists()) throw new Error("Member not found");
              const memberData = memberDoc.data() as TeamMember;

              // Delete the member and update the hotel doc
              transaction.delete(memberRef);
              
              const updates: Partial<Hotel> = { teamSize: increment(-1) };
              if (memberData.role === 'Admin') updates.adminCount = increment(-1);
              if (memberData.role === 'Manager') updates.managerCount = increment(-1);
              if (memberData.role === 'Reception') updates.receptionCount = increment(-1);
              transaction.update(hotelRef, updates);
          });
          return true;
      } catch (e) {
          console.error("Delete transaction failed: ", e);
          return false;
      }
  };

  const addDepartment = (departmentData: Omit<Department, 'id'>) => {
    if (!departmentsCollectionRef) return;
    addDocumentNonBlocking(departmentsCollectionRef, departmentData);
  };
  
  const updateDepartment = (departmentId: string, updates: Partial<Department>) => {
    if (!firestore || !hotelId) return;
    const departmentRef = doc(firestore, 'hotels', hotelId, 'departments', departmentId);
    updateDocumentNonBlocking(departmentRef, updates);
  };

  const deleteDepartment = (departmentId: string) => {
    if (!firestore || !hotelId) return;
    const departmentRef = doc(firestore, 'hotels', hotelId, 'departments', departmentId);
    deleteDocumentNonBlocking(departmentRef);
  };
  
  const reassignMembersAndDeleteDepartment = async (oldDeptName: string, newDeptName: string) => {
    if (!firestore || !hotelId || !departmentsCollectionRef) return;

    const batch = writeBatch(firestore);

    // Find members to reassign
    const membersToReassign = teamMembers.filter(m => m.department === oldDeptName);
    membersToReassign.forEach(member => {
        const memberRef = doc(firestore, 'hotels', hotelId, 'teamMembers', member.id);
        batch.update(memberRef, { department: newDeptName });
    });
    
    // Check if the new department exists. If not, create it.
    let newDeptExists = departments?.some(d => d.name === newDeptName);
    if (!newDeptExists) {
      const newDeptRef = doc(departmentsCollectionRef); // Auto-generates ID
      batch.set(newDeptRef, { name: newDeptName, manages: [] });
    }
    
    // Delete the old department
    const oldDept = departments?.find(d => d.name === oldDeptName);
    if (oldDept) {
        const oldDeptRef = doc(firestore, 'hotels', hotelId, 'departments', oldDept.id);
        batch.delete(oldDeptRef);
    }
    
    await batch.commit();
  }

  const addShift = (shiftData: Omit<Shift, 'id'>) => {
    if (!shiftsCollectionRef) return;
    addDocumentNonBlocking(shiftsCollectionRef, shiftData);
  };

  const updateShift = (shiftId: string, updates: Partial<Shift>) => {
    if (!firestore || !hotelId) return;
    const shiftRef = doc(firestore, 'hotels', hotelId, 'shifts', shiftId);
    updateDocumentNonBlocking(shiftRef, updates);
  };

  const deleteShift = (shiftId: string) => {
    if (!firestore || !hotelId) return;
    const shiftRef = doc(firestore, 'hotels', hotelId, 'shifts', shiftId);
    deleteDocumentNonBlocking(shiftRef);
  };
  
  const addSlaRule = (ruleData: Omit<SlaRule, 'id'>) => {
    if (!slaRulesCollectionRef) return;
    addDocumentNonBlocking(slaRulesCollectionRef, ruleData);
  };

  const updateSlaRule = (ruleId: string, updates: Partial<SlaRule>) => {
    if (!firestore || !hotelId) return;
    const ruleRef = doc(firestore, 'hotels', hotelId, 'slaRules', ruleId);
    updateDocumentNonBlocking(ruleRef, updates);
  };

  const deleteSlaRule = (ruleId: string) => {
    if (!firestore || !hotelId) return;
    const ruleRef = doc(firestore, 'hotels', hotelId, 'slaRules', ruleId);
    deleteDocumentNonBlocking(ruleRef);
  };
  
  return (
    <TeamContext.Provider value={{ 
      teamMembers, 
      departments: departments || [], 
      shifts: shifts || [], 
      slaRules: slaRules || [],
      saveTeamMember,
      deleteTeamMember,
      addDepartment,
      updateDepartment,
      deleteDepartment,
      reassignMembersAndDeleteDepartment,
      addShift,
      updateShift,
      deleteShift,
      addSlaRule,
      updateSlaRule,
      deleteSlaRule,
    }}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
}
