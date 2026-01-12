
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, Building } from 'lucide-react';
import Link from 'next/link';

export default function GeneralGuestLoginPage() {
  const router = useRouter();
  const [hotelId, setHotelId] = useState('');
  const { toast } = useToast();

  const handleProceed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId.trim()) {
      toast({
        variant: "destructive",
        title: "Hotel ID Required",
        description: "Please enter the Hotel ID to proceed.",
      });
      return;
    }
    router.push(`/login/guest/${hotelId.trim()}`);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
                <Logo />
            </div>
          <CardTitle className="text-2xl font-bold font-headline">
            Guest Portal
          </CardTitle>
          <CardDescription>
            Please enter your hotel's ID to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProceed} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hotel-id">Hotel ID</Label>
              <Input
                id="hotel-id"
                value={hotelId}
                onChange={(e) => setHotelId(e.target.value)}
                placeholder="e.g., H12345"
                required
                autoFocus
              />
               <p className="text-xs text-muted-foreground">You can find this ID on your room key card or booking confirmation.</p>
            </div>
            <Button type="submit" className="w-full">
                Proceed
                <ArrowRight className="ml-2"/>
            </Button>
          </form>
        </CardContent>
         <CardFooter className="flex flex-col items-center justify-center text-sm">
            <p className="text-muted-foreground">Are you a hotel employee?</p>
            <Link href="/login" className="underline font-medium text-primary">
              Admin & Team Login
            </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
