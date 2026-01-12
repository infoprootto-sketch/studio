
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { useState } from 'react';

const FormSchema = z.object({
  adminName: z.string().min(2, 'Name must be at least 2 characters'),
  adminEmail: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type AdminFormData = z.infer<typeof FormSchema>;

interface AdminAccountFormProps {
  data: Partial<AdminFormData>;
  onNext: (data: AdminFormData) => void;
  onPrev: () => void;
}

export function AdminAccountForm({ data, onNext, onPrev }: AdminAccountFormProps) {
  const form = useForm<AdminFormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      adminName: data.adminName || '',
      adminEmail: data.adminEmail || '',
      password: data.password || '',
    },
  });
  
  const [showPassword, setShowPassword] = useState(false);

  function onSubmit(formData: AdminFormData) {
    onNext(formData);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <h3 className="text-lg font-semibold">Step 2: Administrator Details</h3>
        <FormField
          control={form.control}
          name="adminName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Full Name</FormLabel>
              <FormControl>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input placeholder="e.g., John Doe" {...field} className="pl-9" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="adminEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Email Address (for login)</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input placeholder="e.g., admin@yourhotel.com" {...field} className="pl-9" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Create a Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" {...field} className="pl-9" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground">
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onPrev}>
            <ArrowLeft className="mr-2" /> Previous
          </Button>
          <Button type="submit">
            Next <ArrowRight className="ml-2" />
          </Button>
        </div>
      </form>
    </Form>
  );
}
