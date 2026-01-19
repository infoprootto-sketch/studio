

'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import { Progress } from '@/components/ui/progress';
import { HotelInformationForm } from '@/components/auth/hotel-information-form';
import { AdminAccountForm } from '@/components/auth/admin-account-form';
import { InitialSettingsForm } from '@/components/auth/initial-settings-form';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import type { Hotel, HotelSettings } from '@/lib/types';
import { z } from 'zod';
import { countries } from '@/lib/countries-currencies';
import { LayoutDashboard, IndianRupee, Users } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

// Combine all form schemas
const hotelSchema = z.object({
  hotelName: z.string().min(3, 'Hotel name must be at least 3 characters'),
  hotelLocation: z.string().min(5, 'Location must be at least 5 characters'),
  hotelEmail: z.string().email('Invalid email address'),
  hotelContact: z.string().min(10, 'Contact number must be at least 10 digits'),
});

const adminSchema = z.object({
  adminName: z.string().min(2, 'Name is too short'),
  adminEmail: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const settingsSchema = z.object({
  country: z.string().min(2, 'Please select a country'),
  currency: z.string().min(3, 'Please select a currency'),
  legalName: z.string().min(3, 'Legal name is required'),
  gstNumber: z.string().optional(),
});

type HotelFormData = z.infer<typeof hotelSchema>;
type AdminFormData = z.infer<typeof adminSchema>;
type SettingsFormData = z.infer<typeof settingsSchema>;

const featureHighlights = [
    {
        icon: LayoutDashboard,
        title: "Live Dashboard",
        description: "Monitor room status, arrivals, and departures in real-time."
    },
    {
        icon: IndianRupee,
        title: "Revenue Analytics",
        description: "Track sales, occupancy, and service performance with detailed charts."
    },
    {
        icon: Users,
        title: "Team Management",
        description: "Manage staff, departments, shifts, and attendance seamlessly."
    },
];


export default function RegisterPage() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    hotelName: '',
    hotelLocation: '',
    hotelEmail: '',
    hotelContact: '',
    adminName: '',
    adminEmail: '',
    password: '',
    country: 'IN',
    currency: 'INR',
    legalName: '',
    gstNumber: '',
  });

  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const [loading, setLoading] = useState(false);

  const handleNext = (data: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...data }));
    setStep(prev => prev + 1);
  };

  const handlePrev = () => {
    setStep(prev => prev - 1);
  };

  const handleFinalSubmit = async (data: SettingsFormData) => {
    setLoading(true);
    const finalData = { ...formData, ...data };
    
    // Validate all data at the end
    const fullSchema = hotelSchema.merge(adminSchema).merge(settingsSchema);
    const validationResult = fullSchema.safeParse(finalData);

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: `${firstError.path.join('.')} - ${firstError.message}`,
      });
      setLoading(false);
      return;
    }

    try {
      if (!auth || !firestore) {
        throw new Error('Firebase not initialized.');
      }
      
      const userCredential = await createUserWithEmailAndPassword(auth, finalData.adminEmail, finalData.password);
      const user = userCredential.user;

      const hotelData: Omit<Hotel, 'id'> = {
        name: finalData.hotelName,
        email: finalData.hotelEmail,
        contactNumber: finalData.hotelContact,
        location: finalData.hotelLocation,
        adminName: finalData.adminName,
        ownerUids: [user.uid],
      };

      const hotelSettings: HotelSettings = {
        country: finalData.country,
        currency: finalData.currency,
        legalName: finalData.legalName,
        gstNumber: finalData.gstNumber || '',
        address: finalData.hotelLocation, // Use location as initial address
        language: countries.find(c => c.code === finalData.country)?.languages[0].code || 'en',
        gstRate: 18, // Default value
        serviceChargeRate: 10, // Default value
        wifiSSID: '',
        wifiPassword: '',
      };

      const hotelDocRef = doc(firestore, 'hotels', user.uid);
      const settingsDocRef = doc(firestore, 'hotels', user.uid, 'config', 'settings');

      await setDoc(hotelDocRef, hotelData);
      await setDoc(settingsDocRef, hotelSettings);

      toast({
        title: 'Account Created!',
        description: `Your hotel "${finalData.hotelName}" is ready. Please log in to continue.`,
      });

      router.push('/login');
    } catch (error: any) {
      console.error("Registration Error: ", error);
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "An unknown error occurred.",
      });
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    <HotelInformationForm key="step1" data={formData} onNext={handleNext} />,
    <AdminAccountForm key="step2" data={formData} onNext={handleNext} onPrev={handlePrev} />,
    <InitialSettingsForm key="step3" data={formData} onSubmit={handleFinalSubmit} onPrev={handlePrev} isLoading={loading} />,
  ];

  return (
     <div className="w-full lg:grid lg:min-h-[100vh] lg:grid-cols-2 xl:min-h-[100vh]">
        <div className="fixed top-4 right-4 z-50">
            <ThemeToggle />
        </div>
       <div className="relative hidden bg-gray-100 lg:flex flex-col items-center justify-center p-8 dark:bg-gray-800">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20 animate-[gradient-move_10s_ease-in-out_infinite] [background-size:200%_200%]"
             style={{ animation: 'gradient-move 10s ease-in-out infinite' }} />
        <div className="relative z-10 text-center">
            <Logo className="mx-auto size-24 bg-primary/20 text-primary border-4 border-primary/30" />
            <h1 className="mt-8 text-4xl font-bold font-headline text-foreground">Welcome to StayCentral</h1>
            <p className="mt-2 text-lg text-muted-foreground">The future of hotel management at your fingertips.</p>
        </div>
        <div className="relative z-10 mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
            {featureHighlights.map(feature => (
                <Card key={feature.title} className="bg-background/50 backdrop-blur-sm">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                             <div className="bg-primary/10 text-primary p-2 rounded-lg">
                                <feature.icon className="size-5" />
                            </div>
                            <div>
                                <p className="font-semibold text-foreground">{feature.title}</p>
                                <p className="text-sm text-muted-foreground">{feature.description}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
      </div>
      <div className="flex items-center justify-center min-h-screen py-12 px-4 animate-fade-in-up">
        <Card className="w-full max-w-lg shadow-2xl relative overflow-hidden">
            <CardHeader className="text-center">
            <div className="flex justify-center mb-4 lg:hidden">
                <Logo />
            </div>
            <CardTitle className="text-2xl font-bold font-headline">Create a Hotel Account</CardTitle>
            <CardDescription>Join StayCentral in a few simple steps.</CardDescription>
            </CardHeader>
            <CardContent>
            <Progress value={(step + 1) / steps.length * 100} className="mb-8" />
            <AnimatePresence mode="wait">
                <motion.div
                key={step}
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                {steps[step]}
                </motion.div>
            </AnimatePresence>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
