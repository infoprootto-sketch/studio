
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import { Check, ArrowRight } from 'lucide-react';

const pricingTiers = [
  {
    name: "Boutique",
    rooms: "Up to 50",
    price: "2,500",
    features: [
        "Core Dashboard & Analytics",
        "Live Room & Service Management",
        "Complete Guest Portal",
        "Team & Department Management",
        "Corporate Billing & Invoicing",
        "Inventory & Stock Control",
        "AI Menu Extractor",
    ]
  },
  {
    name: "Business",
    rooms: "50 to 100",
    price: "5,000",
    features: [
        "Core Dashboard & Analytics",
        "Live Room & Service Management",
        "Complete Guest Portal",
        "Team & Department Management",
        "Corporate Billing & Invoicing",
        "Inventory & Stock Control",
        "AI Menu Extractor",
    ]
  },
  {
    name: "Enterprise",
    rooms: "100+",
    price: "7,500",
    features: [
        "Core Dashboard & Analytics",
        "Live Room & Service Management",
        "Complete Guest Portal",
        "Team & Department Management",
        "Corporate Billing & Invoicing",
        "Inventory & Stock Control",
        "AI Menu Extractor",
    ]
  }
];

export default function PricingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 py-12">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <Logo className="size-16" />
        </div>
        <h1 className="text-5xl font-bold font-headline">Pricing Plans</h1>
        <p className="text-muted-foreground text-xl mt-2">
          Simple, transparent pricing that scales with your hotel.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
        {pricingTiers.map((tier, index) => (
          <Card key={index} className="flex flex-col">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-semibold">{tier.name}</CardTitle>
              <CardDescription className="font-semibold text-primary">{tier.rooms} Rooms</CardDescription>
              <div className="text-4xl font-bold pt-4">
                ₹{tier.price}
                <span className="text-lg font-normal text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-3 text-sm">
                {tier.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-start gap-2">
                    <Check className="size-4 text-green-500 mt-1 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <div className="p-6 pt-0">
              <Button className="w-full" asChild>
                <Link href="/register">
                  Get Started
                  <ArrowRight className="ml-2" />
                </Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>
      
      <div className="mt-12 text-center space-y-2">
        <div>
            <p className="text-muted-foreground">Have a larger chain or need custom features?</p>
            <Button variant="link" asChild>
                <Link href="mailto:sales@staycentral.app">Contact Sales</Link>
            </Button>
        </div>
        <div className="pt-4">
            <Button variant="outline" asChild>
                <Link href="/">Back to Home</Link>
            </Button>
        </div>
      </div>

    </div>
  );
}
