
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, Eye, EyeOff, Lock, Mail, Loader2 } from 'lucide-react';
import { useAuth, useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, collection, where, query } from 'firebase/firestore';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import type { TeamMember } from '@/lib/types';


export default function TeamMemberLoginPage() {
  const router = useRouter();
  const params = useParams();
  const hotelId = params.hotelId as string;
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide both email and password.",
      });
      return;
    }
    setIsLoading(true);

    try {
        if (!auth) throw new Error("Authentication services are not available.");
        await signInWithEmailAndPassword(auth, email, password);
        // Do not redirect here. Let the useEffect handle it.
    } catch (error: any) {
        console.error("Team member login error:", error);
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: error.message || "Could not verify your credentials. Please try again.",
        });
        setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleRedirect = async () => {
        if (!isUserLoading && user && firestore) {
            const teamMemberRef = doc(firestore, `hotels/${hotelId}/teamMembers/${user.uid}`);
            const teamMemberSnap = await getDoc(teamMemberRef);

            if (teamMemberSnap.exists()) {
                const memberData = teamMemberSnap.data() as TeamMember;
                toast({
                    title: "Login Successful",
                    description: "Redirecting to your dashboard...",
                });

                let destination = `/${hotelId}/team/dashboard`; // Default
                if (memberData.role === 'Reception') {
                    destination = `/${hotelId}/reception/dashboard`;
                }
                 if (memberData.role === 'Admin') {
                    destination = `/${hotelId}/dashboard`;
                }
                
                router.push(destination);
            } else {
                 if (auth) await auth.signOut();
                 toast({
                    variant: "destructive",
                    title: "Access Denied",
                    description: "Your account does not belong to this hotel.",
                });
                setIsLoading(false);
            }
        }
    };
    
    handleRedirect();

  }, [user, isUserLoading, firestore, hotelId, router, toast, auth]);


  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
                <Logo />
            </div>
          <CardTitle className="text-2xl font-bold font-headline">
            Team Login
          </CardTitle>
          <CardDescription>
            Enter your credentials for Hotel ID: <span className="font-semibold text-primary">{hotelId}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                    id="email" type="email" placeholder="you@yourhotel.com" required
                    value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                        id="password" type={showPassword ? 'text' : 'password'} required
                        value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} className="pl-9"
                    />
                     <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground">
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || isUserLoading}>
                {isLoading || isUserLoading ? <><Loader2 className="mr-2 animate-spin"/> Verifying...</> : <>Login <ArrowRight className="ml-2"/></>}
            </Button>
          </form>
        </CardContent>
         <CardFooter className="flex-col gap-2 text-center text-sm">
            <Link href="/forgot-password" passHref>
                <Button variant="link" size="sm">Forgot Password?</Button>
            </Link>
             <Link href="/login" passHref>
                <Button variant="link" size="sm">Not a team member? Login here.</Button>
            </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
