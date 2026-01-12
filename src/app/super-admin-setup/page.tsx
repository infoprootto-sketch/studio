'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, Terminal, CheckCircle } from 'lucide-react';
import { setSuperAdminClaim, type AdminSetupState } from '@/lib/admin-actions';
import Link from 'next/link';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Assigning Role...' : 'Make Super Admin'}
    </Button>
  );
}

export default function SuperAdminSetupPage() {
  const initialState: AdminSetupState = { status: 'initial', message: '' };
  const [state, formAction] = useActionState(setSuperAdminClaim, initialState);

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="text-primary" />
            Super Admin Setup
          </CardTitle>
          <CardDescription>
            Enter the User UID of the account you want to grant Super Admin privileges to. You can find this in the Firebase Authentication console.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state.status === 'success' ? (
            <div className="space-y-4 text-center">
               <Alert variant="default" className="border-green-500/50 text-green-700 dark:border-green-500 [&>svg]:text-green-700">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Success!</AlertTitle>
                <AlertDescription>
                    {state.message} You can now log in to access the Super Admin dashboard.
                </AlertDescription>
              </Alert>
              <Button asChild>
                <Link href="/login/super-admin">Go to Super Admin Login</Link>
              </Button>
            </div>
          ) : (
            <form action={formAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="uid">User UID</Label>
                <Input
                  id="uid"
                  name="uid"
                  placeholder="Paste User UID here"
                  required
                />
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
      </Card>
    </div>
  );
}
