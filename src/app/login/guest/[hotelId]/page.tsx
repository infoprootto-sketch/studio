
'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Room } from '@/lib/types';


export default function GuestLoginPage() {
  const router = useRouter();
  const params = useParams();
  const hotelIdFromUrl = params.hotelId as string;
  
  const [stayId, setStayId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedStayId = stayId.trim();
    if (!trimmedStayId || !hotelIdFromUrl) {
      toast({
        variant: "destructive",
        title: "Stay ID Required",
        description: "Please enter the Stay ID provided at check-in.",
      });
      return;
    }
    setIsLoading(true);

    if (!firestore) {
        toast({
            variant: "destructive",
            title: "Service Configuration Error",
            description: "The database is not available. Please contact the front desk.",
        });
        setIsLoading(false);
        return;
    }

    try {
        // Securely check for the active stay document
        const activeStayRef = doc(firestore, `activeStays/${trimmedStayId}`);
        const activeStaySnap = await getDoc(activeStayRef);

        if (!activeStaySnap.exists() || activeStaySnap.data()?.hotelId !== hotelIdFromUrl) {
             toast({
                variant: "destructive",
                title: "Invalid Stay ID",
                description: "The Stay ID you entered was not found or is not valid for this hotel. Please check and try again.",
            });
            setIsLoading(false);
            return;
        }

        router.push(`/guest/${hotelIdFromUrl}/${trimmedStayId}/`);

    } catch (error) {
        console.error("Guest login error:", error);
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: "Could not verify your stay. Please contact the front desk.",
        });
        setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
                <Logo />
            </div>
          <CardTitle className="text-2xl font-bold font-headline">
            Welcome to Your Stay
          </CardTitle>
          <CardDescription>
            Enter your Stay ID to access your guest portal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stay-id">Stay ID</Label>
              <Input
                id="stay-id"
                value={stayId}
                onChange={(e) => setStayId(e.target.value)}
                placeholder="e.g., 101-XYZ"
                required
                autoFocus
                disabled={isLoading}
              />
               <p className="text-xs text-muted-foreground">You can find this ID on your room key card.</p>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Verifying...' : 'Access Portal'}
                {!isLoading && <ArrowRight className="ml-2"/>}
            </Button>
          </form>
        </CardContent>
         <CardFooter>
            <p className="text-xs text-muted-foreground text-center w-full">
                Having trouble? Please contact the front desk.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
