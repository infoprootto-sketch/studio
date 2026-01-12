
'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useHotelId } from '@/context/hotel-id-context';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Trash2, Check, X, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { AccessRequest } from '@/lib/types';


interface Delegate {
    id: string; // This will be the Franchise Owner's UID
}

export function DelegatedAccess() {
  const hotelId = useHotelId();
  const firestore = useFirestore();
  const { toast } = useToast();

  const delegatesCollectionRef = useMemoFirebase(
    () => (firestore && hotelId ? collection(firestore, 'hotels', hotelId, 'delegates') : null),
    [firestore, hotelId]
  );
  const { data: delegates, isLoading: isLoadingDelegates } = useCollection<Delegate>(delegatesCollectionRef);
  
  const requestsCollectionRef = useMemoFirebase(
    () => (firestore && hotelId ? collection(firestore, 'hotels', hotelId, 'accessRequests') : null),
    [firestore, hotelId]
  );
  const { data: accessRequests, isLoading: isLoadingRequests } = useCollection<AccessRequest>(requestsCollectionRef);


  const handleRevokeAccess = async (uid: string) => {
    if (!firestore || !hotelId) return;
    try {
        const delegateRef = doc(firestore, 'hotels', hotelId, 'delegates', uid);
        await deleteDoc(delegateRef);
        toast({ title: 'Access Revoked', description: 'The Franchise Owner can no longer view this hotel.' });
    } catch (error) {
        console.error("Error revoking access: ", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not revoke access.' });
    }
  };

  const handleApproveRequest = async (request: AccessRequest) => {
    if (!firestore || !hotelId) return;
    const batch = writeBatch(firestore);

    // Document to create in /delegates
    const delegateRef = doc(firestore, 'hotels', hotelId, 'delegates', request.requesterUid);
    batch.set(delegateRef, { grantedAt: new Date(), requesterEmail: request.requesterEmail });
    
    // Document to delete from /accessRequests
    const requestRef = doc(firestore, 'hotels', hotelId, 'accessRequests', request.requesterUid);
    batch.delete(requestRef);

    try {
        await batch.commit();
        toast({ title: "Access Granted", description: `${request.requesterEmail} now has read-only access.`});
    } catch (error) {
        console.error("Error approving request: ", error);
        toast({ variant: 'destructive', title: 'Approval Failed' });
    }
  };
  
  const handleDenyRequest = async (request: AccessRequest) => {
      if (!firestore || !hotelId) return;
      const requestRef = doc(firestore, 'hotels', hotelId, 'accessRequests', request.requesterUid);
      try {
        await deleteDoc(requestRef);
        toast({ title: "Request Denied", variant: "destructive" });
      } catch (error) {
        console.error("Error denying request: ", error);
        toast({ variant: 'destructive', title: 'Could not deny request' });
      }
  };

  const toDate = (value: any): Date => {
    if (!value) return new Date();
    if (value.toDate) return value.toDate();
    return new Date(value);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delegated Access</CardTitle>
        <CardDescription>
          Grant or revoke read-only analytical access to Franchise Owners.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div>
            <h3 className="text-md font-semibold mb-2">Incoming Access Requests</h3>
             <div className="border rounded-lg">
                 <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Franchise Owner Email</TableHead>
                        <TableHead>Requested</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoadingRequests ? (
                            <TableRow><TableCell colSpan={3} className="text-center"><Loader2 className="inline-block animate-spin mr-2" />Loading requests...</TableCell></TableRow>
                        ) : accessRequests && accessRequests.length > 0 ? (
                            accessRequests.map((req) => (
                                <TableRow key={req.id}>
                                    <TableCell className="font-mono text-xs">{req.requesterEmail}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">{formatDistanceToNow(toDate(req.requestDate), { addSuffix: true })}</TableCell>
                                    <TableCell className="text-right">
                                        <Button size="sm" variant="destructive" className="mr-2" onClick={() => handleDenyRequest(req)}>
                                            <X className="mr-2" /> Deny
                                        </Button>
                                        <Button size="sm" onClick={() => handleApproveRequest(req)}>
                                            <Check className="mr-2" /> Approve
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={3} className="text-center h-24 text-muted-foreground">No pending access requests.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>

        <div>
            <h3 className="text-md font-semibold mb-2">Current Delegations</h3>
            <div className="border rounded-lg">
                 <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Franchise Owner UID</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoadingDelegates ? (
                            <TableRow><TableCell colSpan={2} className="text-center"><Loader2 className="inline-block animate-spin mr-2" />Loading delegations...</TableCell></TableRow>
                        ) : delegates && delegates.length > 0 ? (
                            delegates.map((delegate) => (
                                <TableRow key={delegate.id}>
                                    <TableCell className="font-mono text-xs">{delegate.id}</TableCell>
                                    <TableCell className="text-right">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="sm">
                                                    <Trash2 className="mr-2" /> Revoke
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will immediately revoke read-access for this user.
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleRevokeAccess(delegate.id)}>
                                                    Confirm Revoke
                                                </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                             <TableRow><TableCell colSpan={2} className="text-center h-24 text-muted-foreground">No access has been delegated yet.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
