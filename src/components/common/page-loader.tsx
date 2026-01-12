'use client';

import { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export function PageLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setProgress(0);
    setIsVisible(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (progress === 0 && isVisible) {
      // Start the loading animation
      timer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) {
            clearInterval(timer);
            return 95;
          }
          // Animate progress with a non-linear speed
          if (prev < 60) return prev + 5;
          if (prev < 85) return prev + 2;
          return prev + 0.5;
        });
      }, 100);
    }
    return () => clearInterval(timer);
  }, [progress, isVisible]);
  
  useEffect(() => {
      // When route change starts
      setIsVisible(true);
      setProgress(1);

      // When route change completes
      const handleComplete = () => {
          setProgress(100);
          setTimeout(() => {
              setIsVisible(false);
              setTimeout(() => setProgress(0), 200);
          }, 300);
      };
      
      // We'll use a simple timeout to simulate loading completion for now.
      // In a real app with complex data fetching, you might use Next.js's router events.
      const routeChangeTimer = setTimeout(handleComplete, 500); // Simulate load time
      
      return () => clearTimeout(routeChangeTimer);

  }, [pathname, searchParams]);

  return (
    <div className={cn(
      "fixed top-0 left-0 w-full z-50 transition-opacity duration-300",
      isVisible ? "opacity-100" : "opacity-0"
    )}>
      <Progress value={progress} className="h-1 rounded-none" />
    </div>
  );
}
