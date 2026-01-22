'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import { ArrowRight, LogIn, User, Users, Building, Briefcase, Bot, FileSignature, Settings, Activity, ShieldAlert, IndianRupee } from 'lucide-react';
import { useEffect, useRef, useState, MouseEvent, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay"
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
import { HomePageClient } from '@/components/home-page-client';


const hotelFeatures = [
  "Comprehensive Dashboard",
  "Live Room & Service Management",
  "Revenue & Analytics Tracking",
  "Guest & Booking Management"
];

const franchiseFeatures = [
    "Portfolio-wide dashboard",
    "Aggregated revenue analytics",
    "Read-only access to hotel data",
    "Performance comparisons",
];

const guestFeatures = [
  "In-Room Dining Orders",
  "AI-Powered Local Recommendations",
  "Service Requests (Amenities, Laundry)",
  "Real-time Bill Tracking"
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
  const autoplayPlugin = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true, stopOnMouseEnter: true })
  );
  
  return (
    <>
      <Suspense fallback={null}>
        <HomePageClient />
      </Suspense>
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 py-12">
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-6xl mt-16">
          
          <div className="transition-all duration-300 hover:scale-[1.03] hover:shadow-xl">
              <Card className="flex flex-col h-full ring-2 ring-primary/50">
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
          </div>
          
          <div className="transition-all duration-300 hover:scale-[1.03] hover:shadow-xl">
              <Card className="flex flex-col h-full ring-2 ring-primary/50">
                  <CardHeader>
                      <div className="flex items-center gap-4">
                          <Briefcase className="size-8 text-primary" />
                          <CardTitle className="text-2xl font-headline">For Franchise Owners</CardTitle>
                      </div>
                      <CardDescription>Oversee your entire hotel portfolio with aggregated analytics and performance data.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow flex flex-col justify-between">
                      <ul className="space-y-2 text-sm mb-4">
                          {franchiseFeatures.map(feature => (
                              <li key={feature} className="flex items-center gap-2">
                                  <ArrowRight className="size-4 text-primary" />
                                  <span>{feature}</span>
                              </li>
                          ))}
                      </ul>
                      <Button className="w-full" variant="outline" asChild>
                          <Link href="/login/franchise">
                              <LogIn className="mr-2" />
                              Franchise Owner Login
                          </Link>
                      </Button>
                  </CardContent>
              </Card>
          </div>

          <div className="transition-all duration-300 hover:scale-[1.03] hover:shadow-xl">
              <Card className="flex flex-col h-full ring-2 ring-primary/50">
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

        <section className="w-full max-w-4xl mt-20 text-center">
          <div className="transition-transform duration-300 hover:scale-105 hover:shadow-xl">
            <Card className="bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 p-8">
              <h2 className="text-3xl font-bold font-headline">How It Works</h2>
              <p className="mt-2 text-muted-foreground">Get your hotel up and running in three simple steps.</p>
              <div className="relative mt-12">
                  <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -translate-y-1/2"></div>
                  <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
                      {howItWorksSteps.map((step) => (
                          <div key={step.title} className="flex flex-col items-center text-center gap-4 bg-background/50 backdrop-blur-sm p-4 rounded-lg">
                              <div className="bg-primary text-primary-foreground size-12 rounded-full flex items-center justify-center text-xl font-bold border-4 border-background">
                                  {step.title.charAt(0)}
                              </div>
                              <h3 className="text-lg font-semibold">{step.title.substring(3)}</h3>
                              <p className="text-muted-foreground text-sm">{step.description}</p>
                          </div>
                      ))}
                  </div>
              </div>
            </Card>
          </div>
        </section>
        
        <section className="w-full max-w-4xl mt-24 text-center transition-transform duration-300 hover:scale-105 hover:shadow-xl">
          <div className="bg-secondary/30 py-12 rounded-lg">
              <h2 className="text-3xl font-bold font-headline">Simple, Transparent Pricing</h2>
              <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
              Choose a plan that fits your hotel's size. No hidden fees, no commissions.
              </p>
              <Button size="lg" className="mt-6" asChild>
                  <Link href="/pricing">
                      <IndianRupee className="mr-2" />
                      View Pricing Plans
                  </Link>
              </Button>
          </div>
        </section>

        <footer className="mt-24 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} StayCentral. All rights reserved.</p>
        </footer>
      </div>
    </>
  );
}
