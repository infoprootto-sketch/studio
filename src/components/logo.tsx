import { Hotel } from 'lucide-react';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-primary text-primary-foreground size-12 rounded-lg shadow-md ${className}`}>
      <Hotel className="size-6" />
    </div>
  );
}
