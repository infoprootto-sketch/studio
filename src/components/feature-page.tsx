
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { allFeatures } from '@/lib/feature-list';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Separator } from './ui/separator';

interface FeatureSection {
  title: string;
  description: string;
}

interface FeaturePageProps {
  title: string;
  description: string;
  featureSections: FeatureSection[];
  currentHref: string;
}

export function FeaturePage({ title, description, featureSections, currentHref }: FeaturePageProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="text-center">
        <Badge variant="outline" className="mb-4">Feature Spotlight</Badge>
        <h1 className="text-4xl font-bold font-headline tracking-tight">{title}</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
          {description}
        </p>
      </div>

      <section>
        <h2 className="text-2xl font-bold text-center mb-8 font-headline">Explore Other Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allFeatures.map((feature) => {
            const isActive = feature.href === currentHref;
            return (
              <Link href={feature.href} key={feature.href} className="group">
                <Card className={cn(
                  "h-full transition-all duration-200 group-hover:border-primary",
                  isActive ? "bg-primary/10 border-primary ring-2 ring-primary" : "bg-card"
                )}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        isActive ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                      )}>
                        <feature.icon className="size-5" />
                      </div>
                      <CardTitle className="text-base">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            )
          })}
        </div>
      </section>
      
      <Separator />

      <div className="space-y-8">
        {featureSections.map((section) => (
          <Card key={section.title} className="bg-muted/30">
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{section.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
