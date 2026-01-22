

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
import { useAuth, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Check, Eye, EyeOff, BarChart3, Users, LayoutDashboard, IndianRupee, Mail, Lock } from 'lucide-react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ThemeToggle } from '@/components/theme-toggle';
import type { TeamMember } from '@/lib/types';

const featureHighlights = [
    {
        icon: LayoutDashboard,
        title: "Live Dashboard",
        description: "Monitor room status, arrivals, and departures in real-time."
    },
    {
        icon: IndianRupee,
        title: "Revenue Analytics",
        description: "Track sales, occupancy, and service performance with detailed charts."
    },
    {
        icon: Users,
        title: "Team Management",
        description: "Manage staff, departments, shifts, and attendance seamlessly."
    },
];

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setIsSuccess(false);

    try {
      if (!auth || !firestore) {
        toast({
          variant: "destructive",
          title: "Authentication service not available.",
        });
        setLoading(false);
        return;
      }
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if the user is a hotel owner (primary admin)
      const hotelDocRef = doc(firestore, 'hotels', user.uid);
      const hotelDocSnap = await getDoc(hotelDocRef);
      
      if (hotelDocSnap.exists()) {
        const hotelData = hotelDocSnap.data();
        if (hotelData.status === 'Disabled') {
          await auth.signOut();
          throw new Error("This hotel account has been disabled. Please contact support.");
        }
        
        const destination = `/${user.uid}/dashboard`;
        setLoading(false);
        setIsSuccess(true);
        toast({
          title: "Login Successful",
          description: "Redirecting to your dashboard...",
        });
        setTimeout(() => {
          router.push(destination);
        }, 1000);
        return;
      }

      // If not primary owner, check if they are a co-admin in any hotel
      const hotelsCollection = collection(firestore, 'hotels');
      const hotelsSnapshot = await getDocs(hotelsCollection);
      let adminHotelId: string | null = null;
      
      for (const hotelDoc of hotelsSnapshot.docs) {
        const teamMemberRef = doc(firestore, 'hotels', hotelDoc.id, 'teamMembers', user.uid);
        const teamMemberSnap = await getDoc(teamMemberRef);
        if (teamMemberSnap.exists()) {
          const memberData = teamMemberSnap.data() as TeamMember;
          if (memberData.role === 'Admin' || memberData.role === 'Owner') {
            adminHotelId = hotelDoc.id;
            break;
          }
        }
      }

      if (adminHotelId) {
        const destination = `/${adminHotelId}/dashboard`;
        setLoading(false);
        setIsSuccess(true);
        toast({
          title: "Admin Login Successful",
          description: "Redirecting to your hotel dashboard...",
        });
        setTimeout(() => {
          router.push(destination);
        }, 1000);
        return;
      }

      // If user is neither, deny login from this page
      await auth.signOut();
      throw new Error("This login page is for Hotel Admins only. Please use the Team Member login if you are part of a team.");

    } catch (error: any) {
      console.error("Login Error: ", error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "An unknown error occurred.",
      });
      setLoading(false);
      setIsSuccess(false);
    }
  };

  return (
     <div className="w-full lg:grid lg:min-h-[100vh] lg:grid-cols-2 xl:min-h-[100vh]">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="relative hidden bg-gray-100 lg:flex flex-col items-center justify-center p-8 dark:bg-gray-800">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20 animate-[gradient-move_10s_ease-in-out_infinite] [background-size:200%_200%]"
             style={{ animation: 'gradient-move 10s ease-in-out infinite' }} />
        <div className="relative z-10 text-center">
            <Logo className="mx-auto size-24 bg-primary/20 text-primary border-4 border-primary/30" />
            <h1 className="mt-8 text-4xl font-bold font-headline text-foreground">Welcome Back to StayCentral</h1>
            <p className="mt-2 text-lg text-muted-foreground">The future of hotel management at your fingertips.</p>
        </div>
        <div className="relative z-10 mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
            {featureHighlights.map(feature => (
                <Card key={feature.title} className="bg-background/50 backdrop-blur-sm">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                             <div className="bg-primary/10 text-primary p-2 rounded-lg">
                                <feature.icon className="size-5" />
                            </div>
                            <div>
                                <p className="font-semibold text-foreground">{feature.title}</p>
                                <p className="text-sm text-muted-foreground">{feature.description}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
      </div>
      <div className="flex items-center justify-center min-h-screen py-12 px-4 animate-fade-in-up">
        <Card className="mx-auto w-full max-w-sm shadow-2xl">
            <CardHeader className="space-y-2 text-center">
            <div className="flex justify-center mb-4 lg:hidden">
                <Logo />
            </div>
            <CardTitle className="text-2xl font-bold font-headline">Admin Login</CardTitle>
            <CardDescription>Enter your admin credentials to access your dashboard.</CardDescription>
            </CardHeader>
            <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input 
                            id="email" 
                            type="email" 
                            placeholder="you@yourhotel.com" 
                            required 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading || isSuccess}
                            className="pl-9"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Link
                            href="/forgot-password"
                            className="text-xs text-muted-foreground underline"
                        >
                            Forgot your password?
                        </Link>
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input 
                            id="password" 
                            type={showPassword ? 'text' : 'password'} 
                            required 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading || isSuccess}
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
                <Button type="submit" className="w-full h-12 transition-all" disabled={loading || isSuccess}>
                    {loading ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-foreground"></div>
                    ) : isSuccess ? (
                        <Check className="size-6" />
                    ) : "Login"}
                </Button>
            </form>
            <div className="mt-4 text-center text-sm">
                New to StayCentral?{' '}
                <Link href="/register" className="underline">
                Create a hotel account
                </Link>
            </div>
             <div className="mt-4 text-center text-sm">
                Are you a Team Member?{' '}
                <Link href="/login/team" className="underline">
                Login here
                </Link>
            </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
