
'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, Terminal, CheckCircle, UserPlus } from 'lucide-react';
import { setSuperAdminClaim, setFranchiseOwnerClaim, type AdminSetupState } from '@/lib/admin-actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function SuperAdminSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Assigning...' : 'Make Super Admin'}
    </Button>
  );
}

function FranchiseOwnerSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Assigning...' : 'Make Franchise Owner'}
    </Button>
  );
}

export function ManageRoles() {
  const initialState: AdminSetupState = { status: 'initial', message: '' };
  const [superAdminState, superAdminFormAction] = useActionState(setSuperAdminClaim, initialState);
  const [franchiseOwnerState, franchiseOwnerFormAction] = useActionState(setFranchiseOwnerClaim, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage User Roles</CardTitle>
        <CardDescription>
          Grant special privileges to users by assigning them roles.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="franchise">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="franchise">Franchise Owners</TabsTrigger>
                <TabsTrigger value="super-admin">Super Admins</TabsTrigger>
            </TabsList>
            <TabsContent value="franchise" className="pt-4">
                <p className="text-sm text-muted-foreground mb-4">
                    Enter the email of a registered user to grant them portfolio-wide access capabilities. They can then log in via the Franchise Portal.
                </p>
                {franchiseOwnerState.status === 'success' ? (
                    <Alert variant="default" className="border-green-500/50 text-green-700 dark:border-green-500 [&>svg]:text-green-700">
                        <CheckCircle className="h-4 w-4" />
                        <AlertTitle>Success!</AlertTitle>
                        <AlertDescription>{franchiseOwnerState.message}</AlertDescription>
                    </Alert>
                ) : (
                    <form action={franchiseOwnerFormAction} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">User Email</Label>
                            <Input id="email" name="email" type="email" placeholder="Enter user's email" required />
                        </div>
                        <FranchiseOwnerSubmitButton />
                    </form>
                )}
                 {franchiseOwnerState.status === 'error' && (
                    <Alert variant="destructive" className="mt-4">
                        <Terminal className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{franchiseOwnerState.message}</AlertDescription>
                    </Alert>
                )}
            </TabsContent>
            <TabsContent value="super-admin" className="pt-4">
                 <p className="text-sm text-muted-foreground mb-4">
                    Enter the UID of a user to grant them Super Admin rights. UID can be found in the Firebase Authentication console.
                </p>
                {superAdminState.status === 'success' ? (
                     <Alert variant="default" className="border-green-500/50 text-green-700 dark:border-green-500 [&>svg]:text-green-700">
                        <CheckCircle className="h-4 w-4" />
                        <AlertTitle>Success!</AlertTitle>
                        <AlertDescription>{superAdminState.message}</AlertDescription>
                    </Alert>
                ) : (
                     <form action={superAdminFormAction} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="uid">User UID</Label>
                            <Input id="uid" name="uid" placeholder="Paste User UID here" required />
                        </div>
                        <SuperAdminSubmitButton />
                    </form>
                )}
                {superAdminState.status === 'error' && (
                    <Alert variant="destructive" className="mt-4">
                        <Terminal className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{superAdminState.message}</AlertDescription>
                    </Alert>
                )}
            </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

