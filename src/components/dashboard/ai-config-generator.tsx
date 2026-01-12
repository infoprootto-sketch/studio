
'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { handleGenerateHotelFiles, type HotelConfigState } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Bot } from 'lucide-react';
import { useHotelId } from '@/context/hotel-id-context';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Generating...' : 'Generate and Apply Config'}
      <Bot className="ml-2" />
    </Button>
  );
}

export function AiConfigGenerator() {
  const hotelId = useHotelId();
  const initialState: HotelConfigState = {
    formState: 'initial',
    message: '',
    data: null,
  };

  const [state, formAction] = useActionState(handleGenerateHotelFiles, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI-Powered Configuration</CardTitle>
        <CardDescription>
          Use AI to dynamically configure aspects of your hotel. Describe what you need, and the AI will generate and apply the settings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="hotelId" value={hotelId} />
          <div className="space-y-2">
            <Label htmlFor="preferences">Configuration Request</Label>
            <Textarea
              id="preferences"
              name="preferences"
              placeholder="e.g., 'Set up a boutique hotel theme focused on local cuisine with three room types: Cozy Queen, Deluxe King, and a Royal Suite.' or 'Add 5 new services for our business clients like meeting room booking and document printing.'"
              required
              rows={3}
            />
          </div>
          <SubmitButton />
        </form>

        {state.formState === 'error' && (
          <Alert variant="destructive" className="mt-4">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}

        {state.formState === 'success' && state.data && (
          <div className="mt-6">
            <Alert>
              <Terminal className="h-4 w-4" />
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

    