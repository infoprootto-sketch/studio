
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Building, FileText } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { countries } from '@/lib/countries-currencies';
import { useEffect } from 'react';

const FormSchema = z.object({
  country: z.string().min(2, 'Please select a country'),
  currency: z.string().min(3, 'Please select a currency'),
  legalName: z.string().min(3, 'Legal name is required'),
  gstNumber: z.string().optional(),
});

type SettingsFormData = z.infer<typeof FormSchema>;

interface InitialSettingsFormProps {
  data: Partial<SettingsFormData> & { hotelName?: string };
  onSubmit: (data: SettingsFormData) => void;
  onPrev: () => void;
  isLoading: boolean;
}

export function InitialSettingsForm({ data, onSubmit, onPrev, isLoading }: InitialSettingsFormProps) {
  const form = useForm<SettingsFormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      country: data.country || 'IN',
      currency: data.currency || 'INR',
      legalName: data.legalName || data.hotelName || '',
      gstNumber: data.gstNumber || '',
    },
  });

  const selectedCountry = form.watch('country');

  useEffect(() => {
    const countryData = countries.find(c => c.code === selectedCountry);
    if (countryData) {
      form.setValue('currency', countryData.currencies[0].code);
    }
  }, [selectedCountry, form]);
  
  useEffect(() => {
    if (data.hotelName) {
      form.setValue('legalName', data.hotelName);
    }
  }, [data.hotelName, form]);

  const countryData = countries.find(c => c.code === selectedCountry);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <h3 className="text-lg font-semibold">Step 3: Initial Settings</h3>
        <p className="text-sm text-muted-foreground">These details are important for billing and localization. You can change them later.</p>

        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Country</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select a country" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {countries.map((c) => (
                        <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Currency</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={!countryData || countryData.currencies.length <= 1}>
                    <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select a currency" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {countryData?.currencies.map((c) => (
                        <SelectItem key={c.code} value={c.code}>{c.name} ({c.symbol})</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
        />
        </div>
        <FormField
          control={form.control}
          name="legalName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Legal / Registered Company Name</FormLabel>
              <FormControl>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input placeholder="e.g., The Grand Stay Pvt. Ltd." {...field} className="pl-9" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="gstNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>GST Number (Optional)</FormLabel>
              <FormControl>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input placeholder="Your business GSTIN" {...field} className="pl-9" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onPrev} disabled={isLoading}>
            <ArrowLeft className="mr-2" /> Previous
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Complete Registration'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

