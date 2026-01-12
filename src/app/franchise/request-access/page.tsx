
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Send, Terminal, CheckCircle, Hotel, Loader2 } from 'lucide-react';
import { useUser } from '@/firebase';
import { useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export interface RequestAccessState {
  status: 'initial' | 'success' | 'error';
  message: string;
}

// This component now handles its own logic instead of using a server action
export default function RequestAccessPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [hotelId, setHotelId] = useState('');
  const [state, setState] = useState<RequestAccessState>({ status: 'initial', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRequestAccess(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !firestore) {
      setState({ status: 'error', message: 'User not logged in or services unavailable.' });
      return;
    }

    if (!hotelId.trim()) {
      setState({ status: 'error', message: 'Hotel ID is required.' });
      return;
    }
    
    setIsSubmitting(true);
    setState({ status: 'initial', message: '' });

    try {
        const requestRef = doc(firestore, 'hotels', hotelId, 'accessRequests', user.uid);
        
        await setDoc(requestRef, {
            requesterUid: user.uid,
            requesterEmail: user.email,
            requestDate: new Date(),
        });
      
        setState({ status: 'success', message: `Your request to access Hotel ID: ${hotelId} has been sent to the hotel administrator for approval.` });
        setHotelId(''); // Clear input on success

    } catch (error: any) {
        console.error("Access Request Error:", error);
        setState({ status: 'error', message: error.message || 'Could not send access request. Please check the Hotel ID.' });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">Request Hotel Access</h1>
        <p className="text-muted-foreground">Enter a Hotel ID to request analytical access from its administrator.</p>
      </div>

      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>New Access Request</CardTitle>
          <CardDescription>
            Once approved, the hotel will appear on your main portfolio dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state.status === 'success' ? (
            <Alert variant="default" className="border-green-500/50 text-green-700 dark:border-green-500 [&>svg]:text-green-700">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Request Sent!</AlertTitle>
                <AlertDescription>
                    {state.message}
                </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleRequestAccess} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hotelId">Hotel ID</Label>
                <div className="relative">
                    <Hotel className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                        id="hotelId"
                        name="hotelId"
                        placeholder="Paste the Hotel ID here"
                        required
                        className="pl-9"
                        value={hotelId}
                        onChange={(e) => setHotelId(e.target.value)}
                        disabled={isSubmitting}
                    />
                </div>
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? <><Loader2 className="animate-spin mr-2" /> Sending Request...</> : <><Send className="mr-2" /> Request Access</>}
              </Button>
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
