
'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, Terminal, CheckCircle, ArrowLeft } from 'lucide-react';
import { setSuperAdminClaim, type AdminSetupState } from '@/lib/admin-actions';
import { Logo } from '@/components/logo';
import Link from 'next/link';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Assigning...' : 'Make Super Admin'}
    </Button>
  );
}

export default function SuperAdminSetupPage() {
  const initialState: AdminSetupState = { status: 'initial', message: '' };
  const [state, formAction] = useActionState(setSuperAdminClaim, initialState);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo />
          </div>
          <CardTitle className="text-2xl font-bold font-headline flex items-center justify-center gap-2">
            <Shield className="text-primary" /> Super Admin Setup
          </CardTitle>
          <CardDescription>
            Assign the initial Super Admin role to a registered user.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Enter the **UID** of a user to grant them Super Admin rights. You can find the UID in the Firebase Authentication console.
          </p>

          {state.status === 'success' ? (
            <Alert variant="default" className="border-green-500/50 text-green-700 dark:border-green-500 [&>svg]:text-green-700">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : (
            <form action={formAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="uid">User UID</Label>
                <Input id="uid" name="uid" placeholder="Paste User UID here" required />
              </div>
              <SubmitButton />
            </form>
          )}

          {state.status === 'error' && (
            <Alert variant="destructive" className="mt-4">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
            <Button variant="link" asChild>
                <Link href="/login/super-admin">
                    <ArrowLeft className="mr-2" /> Back to Super Admin Login
                </Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
