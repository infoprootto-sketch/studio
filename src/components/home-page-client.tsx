
'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

export function HomePageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    const shouldLogout = searchParams.get('logout') === 'true';
    if (shouldLogout && auth) {
      signOut(auth).then(() => {
        toast({
          title: "Logged Out",
          description: "You have been successfully logged out."
        });
        // Use router.replace to remove the query param from the URL
        router.replace('/', undefined);
      });
    }
  }, [searchParams, auth, router, toast]);

  return null; // This component does not render anything itself
}
