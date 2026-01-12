
'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { Eye, EyeOff, Lock, Mail, ShieldAlert } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function FranchiseOwnerLoginPage() {
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
      
      if (!idTokenResult.claims.isFranchiseOwner) {
        await auth.signOut();
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "This account does not have Franchise Owner privileges. Please contact support if you believe this is an error.",
        });
        setLoading(false);
        return;
      }
      
      toast({
        title: "Franchise Owner Login Successful",
        description: "Redirecting to the master dashboard...",
      });

      router.push('/franchise');

    } catch (error: any) {
      console.error("Franchise Owner Login Error: ", error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Invalid credentials or you do not have Franchise Owner privileges.",
      });
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        if (!auth) throw new Error("Auth service is not available");
        
        await createUserWithEmailAndPassword(auth, email, password);
        
        await auth.signOut();
        
        toast({
            title: "Registration Successful",
            description: "Your account has been created. IMPORTANT: You must now contact a Super Admin to have your account promoted to a Franchise Owner before you can log in.",
            duration: 10000,
        });

        // Clear form and switch to login tab
        setEmail('');
        setPassword('');

    } catch (error: any) {
        console.error("Franchise registration error: ", error);
        toast({
            variant: "destructive",
            title: "Registration Failed",
            description: error.message || "Could not create account. The email may already be in use."
        });
    } finally {
        setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-sm bg-background">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo />
          </div>
          <CardTitle className="text-2xl font-bold font-headline">
            Franchise Owner Portal
          </CardTitle>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="login">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                <TabsContent value="login" className="space-y-4 pt-4">
                    <CardDescription className="text-center">
                        Enter your credentials to access your hotel portfolio.
                    </CardDescription>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                        <Label htmlFor="email-login">Email</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input id="email-login" type="email" placeholder="franchise.owner@staycentral.app" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} className="pl-9"/>
                        </div>
                        </div>
                        <div className="space-y-2">
                        <Label htmlFor="password-login">Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input id="password-login" type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} className="pl-9" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground">
                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                        </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Authenticating...' : 'Login to Your Portfolio'}
                        </Button>
                    </form>
                </TabsContent>
                 <TabsContent value="register" className="space-y-4 pt-4">
                    <CardDescription className="text-center">
                        Create a new account. You must be approved by an admin to gain access.
                    </CardDescription>
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-2">
                        <Label htmlFor="email-register">Email</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input id="email-register" type="email" placeholder="your.email@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} className="pl-9"/>
                        </div>
                        </div>
                        <div className="space-y-2">
                        <Label htmlFor="password-register">Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input id="password-register" type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} className="pl-9" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground">
                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                        </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Creating Account...' : 'Register'}
                        </Button>
                    </form>
                </TabsContent>
            </Tabs>
          
          <div className="mt-4 text-center text-sm">
            <Link href="/" className="underline text-muted-foreground">
              Return to Homepage
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
