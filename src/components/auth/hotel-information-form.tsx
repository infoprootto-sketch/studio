
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ArrowRight, Building, Mail, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';

const FormSchema = z.object({
  hotelName: z.string().min(3, 'Hotel name must be at least 3 characters'),
  hotelLocation: z.string().min(5, 'Please enter a valid address'),
  hotelEmail: z.string().email('Invalid email address'),
  hotelContact: z.string().min(10, 'Please enter a valid phone number'),
});

type HotelFormData = z.infer<typeof FormSchema>;

interface HotelInformationFormProps {
  data: Partial<HotelFormData>;
  onNext: (data: HotelFormData) => void;
}

export function HotelInformationForm({ data, onNext }: HotelInformationFormProps) {
  const form = useForm<HotelFormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      hotelName: data.hotelName || '',
      hotelLocation: data.hotelLocation || '',
      hotelEmail: data.hotelEmail || '',
      hotelContact: data.hotelContact || '',
    },
  });

  function onSubmit(formData: HotelFormData) {
    onNext(formData);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <h3 className="text-lg font-semibold">Step 1: Hotel Details</h3>
        <FormField
          control={form.control}
          name="hotelName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hotel Name</FormLabel>
              <FormControl>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input placeholder="e.g., The Grand Stay" {...field} className="pl-9" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="hotelLocation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hotel Location / Address</FormLabel>
              <FormControl>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input placeholder="e.g., 123 Main St, Anytown" {...field} className="pl-9" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="hotelEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Official Hotel Email</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input placeholder="e.g., contact@thegrandstay.com" {...field} className="pl-9" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="hotelContact"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Official Hotel Contact Number</FormLabel>
              <FormControl>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input placeholder="e.g., +1 234 567 890" {...field} className="pl-9" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-between items-center pt-4">
            <Button variant="link" asChild>
                <Link href="/">Back to Home</Link>
            </Button>
            <Button type="submit">
                Next <ArrowRight className="ml-2" />
            </Button>
        </div>
      </form>
    </Form>
  );
}
