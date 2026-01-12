
'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Eye, EyeOff, Lock, Mail, ShieldAlert, UserPlus } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ThemeToggle } from '@/components/theme-toggle';
import { Separator } from '@/components/ui/separator';

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!auth) {
        throw new Error("Authentication service not available.");
      }
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idTokenResult = await userCredential.user.getIdTokenResult();
      
      if (!idTokenResult.claims.isSuperAdmin) {
        await auth.signOut();
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "This account does not have Super Admin privileges. Please contact support if you believe this is an error.",
        });
        setLoading(false);
        return;
      }

      toast({
        title: "Super Admin Login Successful",
        description: "Redirecting to the master dashboard...",
      });

      router.push('/super-admin');

    } catch (error: any) {
      console.error("Super Admin Login Error: ", error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid credentials or you do not have Super Admin privileges.",
      });
      setLoading(false);
    }
  };

  return (
    <div className="w-full lg:grid lg:min-h-[100vh] lg:grid-cols-2 xl:min-h-[100vh]">
        <div className="fixed top-4 right-4 z-50">
            <ThemeToggle />
        </div>
      <div className="relative hidden bg-gray-100 lg:flex flex-col items-center justify-center p-8 dark:bg-gray-800">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-primary/10 animate-[gradient-move_15s_ease-in-out_infinite] [background-size:200%_200%]"
             style={{ animation: 'gradient-move 15s ease-in-out infinite' }} />
        <div className="relative z-10 text-center max-w-md">
            <div className="flex justify-center mb-4">
                <Logo className="border-2 border-yellow-500/50" />
            </div>
            <h1 className="mt-8 text-4xl font-bold font-headline text-foreground">Super Admin Portal</h1>
            <p className="mt-2 text-lg text-muted-foreground">Manage the entire StayCentral platform, oversee all hotels, and configure system-wide settings.</p>
        </div>
      </div>
      <div className="flex items-center justify-center min-h-screen py-12 px-4 animate-fade-in-up">
        <div className="w-full max-w-md space-y-8">
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold font-headline flex items-center justify-center gap-2">
                        <ShieldAlert className="text-yellow-500" /> Super Admin Access
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        This login is for authorized platform administrators only.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Administrator Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                id="email"
                                type="email"
                                placeholder="admin@staycentral.app"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                                className="pl-9"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                className="pl-9"
                                />
                                <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground"
                                >
                                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Authenticating...' : 'Authenticate'}
                        </Button>
                    </form>
                    <div className="mt-4 text-center text-sm">
                        <Link href="/" className="underline text-muted-foreground">
                        Return to Homepage
                        </Link>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary text-lg">
                        <UserPlus /> First-Time Setup
                    </CardTitle>
                     <CardDescription className="text-muted-foreground">
                        If you are the platform owner, designate an initial Super Admin account here.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <Alert variant="default" className="text-sm">
                        <AlertTitle>How It Works</AlertTitle>
                        <AlertDescription>
                            <ol className="list-decimal list-inside space-y-1">
                                <li>Register a standard user account.</li>
                                <li>Use the setup utility to promote that user.</li>
                                <li>Log in above with the promoted account.</li>
                            </ol>
                        </AlertDescription>
                    </Alert>
                </CardContent>
                <CardFooter>
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/super-admin-setup">
                            Go to Setup Utility
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
      </div>
    </div>
  );
}
