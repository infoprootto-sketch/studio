'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import { ArrowRight, LogIn, User, Users, Building, Zap, Smile, BarChart3, Bot, FileSignature, Settings, Activity, BedDouble, ConciergeBell, Package, IndianRupee, QrCode, LayoutDashboard, MenuSquare, PlayCircle, ShieldAlert } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay"


const hotelFeatures = [
  "Comprehensive Dashboard",
  "Live Room & Service Management",
  "Revenue & Analytics Tracking",
  "Guest & Booking Management"
];

const guestFeatures = [
  "In-Room Dining Orders",
  "AI-Powered Local Recommendations",
  "Service Requests (Amenities, Laundry)",
  "Real-time Bill Tracking"
];

const comprehensiveFeatures = [
    {
        icon: LayoutDashboard,
        title: "Centralized Admin Dashboard",
        description: "A real-time overview of your entire hotel. Monitor room status, live service queues, and key metrics from one screen."
    },
    {
        icon: QrCode,
        title: "Instant Guest Portal",
        description: "Guests scan a QR code in their room to instantly access in-room dining, service requests, bill tracking, and local guides."
    },
    {
        icon: Users,
        title: "Comprehensive Team Management",
        description: "Manage departments, shifts, attendance, and member roles. Assign tasks and monitor performance with detailed analytics."
    },
    {
        icon: MenuSquare,
        title: "Advanced Room & Service Config",
        description: "Bulk-create rooms, use our AI Menu Scanner to digitize F&B menus, and configure service timings with ease."
    },
    {
        icon: IndianRupee,
        title: "Billing & Revenue Analytics",
        description: "Manage corporate client billing, track payments, and get deep insights into revenue streams and itemized sales data."
    },
    {
        icon: Package,
        title: "Full Inventory Control",
        description: "Track stock levels, manage vendors, set par levels for low-stock alerts, and create cleaning checklists for inventory consumption."
    }
];


const howItWorksSteps = [
    {
        icon: FileSignature,
        title: "1. Register Your Hotel",
        description: "Create your hotel account in minutes with our simple and secure registration process."
    },
    {
        icon: Settings,
        title: "2. Configure Your Setup",
        description: "Easily add your rooms, define services, and onboard your team using our intuitive dashboard."
    },
    {
        icon: Activity,
        title: "3. Operate & Grow",
        description: "Go live! Manage daily operations, track revenue, and delight your guests from day one."
    }
];


export default function HomePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  const autoplayPlugin = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true, stopOnMouseEnter: true })
  );
  
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [showSuperAdminLogin, setShowSuperAdminLogin] = useState(false);
  const clickTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const shouldLogout = searchParams.get('logout') === 'true';
    if (shouldLogout && auth) {
      signOut(auth).then(() => {
        toast({
          title: "Logged Out",
          description: "You have been successfully logged out."
        });
        router.replace('/', undefined);
      });
    }
  }, [searchParams, auth, router, toast]);

  const handleLogoClick = () => {
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
    }
    
    const newCount = logoClickCount + 1;
    setLogoClickCount(newCount);

    if (newCount >= 7) {
      setShowSuperAdminLogin(true);
      setLogoClickCount(0);
    }

    clickTimeout.current = setTimeout(() => {
      setLogoClickCount(0);
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 py-12">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4 cursor-pointer" onClick={handleLogoClick} title="StayCentral">
            <Logo className="size-16" />
        </div>
        <h1 className="text-5xl font-bold font-headline">Welcome to StayCentral</h1>
        <p className="text-muted-foreground text-xl mt-2">The all-in-one solution for modern hotel management.</p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
                <Link href="/register">
                    Get Started for Free
                    <ArrowRight className="ml-2" />
                </Link>
            </Button>
        </div>
        {showSuperAdminLogin && (
           <div className="mt-4 animate-fade-in-up">
                <Button size="sm" variant="destructive" asChild>
                    <Link href="/login/super-admin">
                        <ShieldAlert className="mr-2" /> Super Admin Login
                    </Link>
                </Button>
           </div>
        )}
      </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mt-16">
        
        <Card className="flex flex-col">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Building className="size-8 text-primary" />
                    <CardTitle className="text-2xl font-headline">For Hotels & Teams</CardTitle>
                </div>
                <CardDescription>Manage your entire operation from a single, powerful dashboard with role-based access for your staff.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-between">
                <ul className="space-y-2 text-sm mb-4">
                    {hotelFeatures.map(feature => (
                        <li key={feature} className="flex items-center gap-2">
                            <ArrowRight className="size-4 text-primary" />
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>
                <div className="space-y-2">
                    <Button className="w-full" asChild>
                        <Link href="/login">
                            <LogIn className="mr-2" />
                            Admin Login
                        </Link>
                    </Button>
                    <Button className="w-full" variant="secondary" asChild>
                        <Link href="/login/team">
                            <Users className="mr-2" />
                            Team Member Login
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
        
        <Card className="flex flex-col">
            <CardHeader>
                 <div className="flex items-center gap-4">
                    <User className="size-8 text-primary" />
                    <CardTitle className="text-2xl font-headline">For Guests</CardTitle>
                </div>
                <CardDescription>Enhance your stay with a personalized and seamless digital experience.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-between">
                 <ul className="space-y-2 text-sm mb-4">
                    {guestFeatures.map(feature => (
                        <li key={feature} className="flex items-center gap-2">
                            <ArrowRight className="size-4 text-primary" />
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>
                <Button className="w-full" variant="outline" asChild>
                    <Link href="/guest/login">
                        <LogIn className="mr-2" />
                        Guest Portal Access
                    </Link>
                </Button>
            </CardContent>
        </Card>
      </div>

       <section className="w-full max-w-5xl mt-24">
        <Card className="text-center relative overflow-hidden bg-gradient-to-br from-primary/10 via-transparent to-secondary/10">
          <CardContent className="p-10">
            <h2 className="text-3xl font-bold font-headline">What is StayCentral?</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
              StayCentral is a comprehensive, AI-enhanced platform designed to revolutionize the hospitality industry. We provide hotels with the tools to streamline their daily operations, empower their staff, and deliver an unparalleled digital experience to their guests. From the front desk to the back office, StayCentral is your single source of truth.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="w-full max-w-5xl mt-20 px-4">
          <h2 className="text-3xl font-bold font-headline text-center">Comprehensive Feature Suite</h2>
          <p className="mt-2 text-lg text-muted-foreground text-center max-w-3xl mx-auto">
              Everything you need to manage your hotel efficiently and delight your guests, all in one platform.
          </p>
           <Carousel
                plugins={[autoplayPlugin.current]}
                className="w-full mt-12"
                opts={{
                    align: "start",
                    loop: true,
                }}
            >
                <CarouselContent>
                    {comprehensiveFeatures.map((feature, index) => (
                        <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                            <div className="p-1">
                                <Card className="h-full">
                                    <CardHeader>
                                        <div className="flex items-center gap-3">
                                            <div className="bg-primary/10 text-primary p-2 rounded-lg">
                                                <feature.icon className="size-6" />
                                            </div>
                                            <CardTitle className="text-lg">{feature.title}</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
            </Carousel>
      </section>


      <section className="w-full max-w-4xl mt-20 text-center">
        <h2 className="text-3xl font-bold font-headline">How It Works</h2>
        <p className="mt-2 text-muted-foreground">Get your hotel up and running in three simple steps.</p>
        <div className="relative mt-12">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -translate-y-1/2"></div>
            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
                {howItWorksSteps.map((step) => (
                    <div key={step.title} className="flex flex-col items-center text-center gap-4 bg-background px-4">
                        <div className="bg-primary text-primary-foreground size-12 rounded-full flex items-center justify-center text-xl font-bold border-4 border-background">
                            {step.title.charAt(0)}
                        </div>
                        <h3 className="text-lg font-semibold">{step.title.substring(3)}</h3>
                        <p className="text-muted-foreground text-sm">{step.description}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>

       <section className="w-full max-w-4xl mt-24 text-center bg-secondary/30 py-12 rounded-lg">
        <h2 className="text-3xl font-bold font-headline">Simple, Transparent Pricing</h2>
        <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
          Choose a plan that fits your hotel's size. No hidden fees, no commissions.
        </p>
        <Button size="lg" className="mt-6" variant="outline" asChild>
            <Link href="/pricing">
                <IndianRupee className="mr-2" />
                View Pricing Plans
            </Link>
        </Button>
      </section>
    </div>
  );
}