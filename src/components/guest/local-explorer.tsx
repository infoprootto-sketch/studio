
'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { handleGetLocalRecommendations, type LocalExplorerState } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Wand2, Terminal, Utensils, Hospital, Coffee, LandPlot } from 'lucide-react';
import { Separator } from '../ui/separator';

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Searching...' : children}
      <Wand2 className="ml-2" />
    </Button>
  );
}

const quickSearchItems = [
    { name: 'Restaurants', icon: Utensils, preference: 'Discover local restaurants near me' },
    { name: 'Hospitals', icon: Hospital, preference: 'Find a nearby hospital or emergency clinic' },
    { name: 'Cafes', icon: Coffee, preference: 'Find a quiet, nearby cafe with good coffee' },
    { name: 'Heritage Tours', icon: LandPlot, preference: 'Discover nearby heritage tours like museums, forts, or temples' },
]

export function LocalExplorer() {
  const initialState: LocalExplorerState = {
    formState: 'initial',
    message: '',
    data: null,
  };

  const [state, formAction] = useActionState(handleGetLocalRecommendations, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">AI-Powered Local Exploration</CardTitle>
        <CardDescription>
          Use our quick searches or type a custom request to find the perfect local spots.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
            <Label className="font-semibold">Quick Search</Label>
            <form action={formAction} className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-2">
                {quickSearchItems.map((item) => (
                    <Button key={item.name} type="submit" name="preferences" value={item.preference} variant="outline" className="h-20 flex-col gap-2">
                        <item.icon className="size-6 text-primary" />
                        <span>{item.name}</span>
                    </Button>
                ))}
            </form>
        </div>

        <Separator />
        
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="preferences" className="font-semibold">Custom Search</Label>
            <Textarea
              id="preferences"
              name="preferences"
              placeholder="e.g., Interested in modern art, love Italian food, looking for a quiet coffee shop, and enjoy live jazz music."
              required
              rows={4}
            />
          </div>
          <SubmitButton>Find Recommendations</SubmitButton>
        </form>

        {state.formState === 'loading' && (
            <div className="mt-4 flex items-center justify-center">
                <p>Finding recommendations...</p>
            </div>
        )}

        {state.formState === 'error' && (
          <Alert variant="destructive" className="mt-4">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}

        {state.formState === 'success' && state.data && (
          <div className="mt-6">
            <Card className="bg-muted/30">
                <CardHeader>
                    <CardTitle>Your Personalized Recommendations</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                    <p>{state.data.recommendations}</p>
                </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
