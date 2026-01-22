
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import type { TeamMember, Department, Shift, SlaRule, AttendanceRecord, Hotel } from '@/lib/types';
import { useFirestore, useCollection, useMemoFirebase, useUser, FirestorePermissionError, errorEmitter } from '@/firebase';
import { useHotelId } from './hotel-id-context';
import { collection, doc, writeBatch, runTransaction, getDoc, query, where, increment, addDoc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';
import { initializeApp } from 'firebase/app';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

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
  
  useEffect(() => {
    const provisionOwnerProfile = async () => {
        if (isUserLoading || !user || !firestore || !hotelId || !teamMembers || !shifts) {
            return;
        }

        if (user.uid === hotelId) {
            const ownerInTeam = teamMembers.some(m => m.id === user.uid);
            if (!ownerInTeam) {
                console.log("Provisioning missing profile for hotel owner...");

                const hotelDocRef = doc(firestore, 'hotels', hotelId);
                const hotelSnap = await getDoc(hotelDocRef);

                if (hotelSnap.exists()) {
                    const hotelData = hotelSnap.data() as Hotel;
                    const memberDocRef = doc(firestore, 'hotels', hotelId, 'teamMembers', user.uid);
                    
                    const defaultAdminShift = shifts.find(s => s.name.toLowerCase().includes('admin') || s.name.toLowerCase().includes('general')) || shifts[0];

                    const newMemberProfile: Omit<TeamMember, 'id'> = {
                        name: hotelData.adminName,
                        email: user.email!,
                        department: 'Admin',
                        role: 'Admin',
                        shiftId: defaultAdminShift ? defaultAdminShift.id : 'default-shift',
                        attendanceStatus: 'Clocked Out',
                    };

                    setDoc(memberDocRef, newMemberProfile, { merge: true }).catch(async (serverError) => {
                        const permissionError = new FirestorePermissionError({
                            path: memberDocRef.path,
                            operation: 'create',
                            requestResourceData: newMemberProfile,
                        });
                        errorEmitter.emit('permission-error', permissionError);
                    });

                    toast({
                        title: "Admin Profile Created",
                        description: "A team member profile for you has been automatically created.",
                    });
                }
            }
        }
    };
    provisionOwnerProfile();
  }, [user, isUserLoading, firestore, hotelId, teamMembers, shifts, toast]);


  const saveTeamMember = async (memberData: Partial<TeamMember>, password?: string): Promise<boolean> => {
    if (!firestore || !hotelId || !auth) return false;

    if (memberData.id) {
        const memberRef = doc(firestore, 'hotels', hotelId, 'teamMembers', memberData.id);
        updateDoc(memberRef, { ...memberData, restaurantId: memberData.restaurantId || null }).catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: memberRef.path,
                operation: 'update',
                requestResourceData: { ...memberData, restaurantId: memberData.restaurantId || null }
            });
            errorEmitter.emit('permission-error', permissionError);
        });
        return true;
    }

    if (!memberData.id && password && memberData.email) {
        if (!user) {
            toast({ variant: "destructive", title: "Authentication Error", description: "Admin user not found. Please log in again." });
            return false;
        }

        const tempAppName = `user-creation-${Date.now()}`;
        const tempApp = initializeApp(firebaseConfig, tempAppName);
        const tempAuth = getAuth(tempApp);

        try {
            const userCredential = await createUserWithEmailAndPassword(tempAuth, memberData.email, password);
            const newUserId = userCredential.user.uid;

            const memberRef = doc(firestore, 'hotels', hotelId, 'teamMembers', newUserId);
            const hotelRef = doc(firestore, 'hotels', hotelId);

            const newMemberData: Omit<TeamMember, 'id'> = {
                name: memberData.name!,
                email: memberData.email!,
                department: memberData.department!,
                role: memberData.role!,
                shiftId: memberData.shiftId!,
                attendanceStatus: 'Clocked Out' as const,
                restaurantId: memberData.restaurantId || null,
            };

            await runTransaction(firestore, async (transaction) => {
              transaction.set(memberRef, newMemberData);

              const updates: { [key: string]: any } = { teamSize: increment(1) };
              if (memberData.role === 'Admin') updates.adminCount = increment(1);
              if (memberData.role === 'Manager') updates.managerCount = increment(1);
              if (memberData.role === 'Reception') updates.receptionCount = increment(1);
              transaction.update(hotelRef, updates);
            });
            
            return true;

        } catch (error: any) {
            if (error.code === 'auth/email-already-in-use') {
                toast({
                    variant: "destructive",
                    title: "Email Already In Use",
                    description: `The email ${memberData.email} is already registered.`,
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Creation Failed",
                    description: error.message || "Could not create team member.",
                });
            }
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
    addDoc(departmentsCollectionRef, departmentData).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: departmentsCollectionRef.path,
            operation: 'create',
            requestResourceData: departmentData,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };
  
  const updateDepartment = (departmentId: string, updates: Partial<Department>) => {
    if (!firestore || !hotelId) return;
    const departmentRef = doc(firestore, 'hotels', hotelId, 'departments', departmentId);
    updateDoc(departmentRef, updates).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: departmentRef.path,
            operation: 'update',
            requestResourceData: updates,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const deleteDepartment = (departmentId: string) => {
    if (!firestore || !hotelId) return;
    const departmentRef = doc(firestore, 'hotels', hotelId, 'departments', departmentId);
    deleteDoc(departmentRef).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: departmentRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };
  
  const reassignMembersAndDeleteDepartment = async (oldDeptName: string, newDeptName: string) => {
    if (!firestore || !hotelId || !departmentsCollectionRef) return;

    const batch = writeBatch(firestore);

    const membersToReassign = teamMembers.filter(m => m.department === oldDeptName);
    membersToReassign.forEach(member => {
        const memberRef = doc(firestore, 'hotels', hotelId, 'teamMembers', member.id);
        batch.update(memberRef, { department: newDeptName });
    });
    
    let newDeptExists = departments?.some(d => d.name === newDeptName);
    if (!newDeptExists) {
      const newDeptRef = doc(departmentsCollectionRef);
      batch.set(newDeptRef, { name: newDeptName, manages: [] });
    }
    
    const oldDept = departments?.find(d => d.name === oldDeptName);
    if (oldDept) {
        const oldDeptRef = doc(firestore, 'hotels', hotelId, 'departments', oldDept.id);
        batch.delete(oldDeptRef);
    }
    
    await batch.commit().catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: 'batch-operation',
            operation: 'write'
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  }

  const addShift = (shiftData: Omit<Shift, 'id'>) => {
    if (!shiftsCollectionRef) return;
    addDoc(shiftsCollectionRef, shiftData).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: shiftsCollectionRef.path,
            operation: 'create',
            requestResourceData: shiftData,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const updateShift = (shiftId: string, updates: Partial<Shift>) => {
    if (!firestore || !hotelId) return;
    const shiftRef = doc(firestore, 'hotels', hotelId, 'shifts', shiftId);
    updateDoc(shiftRef, updates).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: shiftRef.path,
            operation: 'update',
            requestResourceData: updates,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const deleteShift = (shiftId: string) => {
    if (!firestore || !hotelId) return;
    const shiftRef = doc(firestore, 'hotels', hotelId, 'shifts', shiftId);
    deleteDoc(shiftRef).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: shiftRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };
  
  const addSlaRule = (ruleData: Omit<SlaRule, 'id'>) => {
    if (!slaRulesCollectionRef) return;
    addDoc(slaRulesCollectionRef, ruleData).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: slaRulesCollectionRef.path,
            operation: 'create',
            requestResourceData: ruleData,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const updateSlaRule = (ruleId: string, updates: Partial<SlaRule>) => {
    if (!firestore || !hotelId) return;
    const ruleRef = doc(firestore, 'hotels', hotelId, 'slaRules', ruleId);
    updateDoc(ruleRef, updates).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: ruleRef.path,
            operation: 'update',
            requestResourceData: updates,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const deleteSlaRule = (ruleId: string) => {
    if (!firestore || !hotelId) return;
    const ruleRef = doc(firestore, 'hotels', hotelId, 'slaRules', ruleId);
    deleteDoc(ruleRef).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: ruleRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
    });
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
    
