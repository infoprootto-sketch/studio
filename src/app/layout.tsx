import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { FirebaseClientProvider } from '@/firebase';
import React from 'react';
import { PageLoader } from '@/components/common/page-loader';
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: {
    template: '%s | StayCentral',
    default: 'StayCentral - The Future of Hotel Management',
  },
  description: 'StayCentral is an all-in-one, AI-enhanced hotel management solution designed to streamline operations, empower staff, and deliver an unparalleled digital experience to guests.',
  openGraph: {
    title: 'StayCentral - The Future of Hotel Management',
    description: 'Streamline hotel operations and enhance the guest experience with our all-in-one platform.',
    url: 'https://staycentral.app',
    siteName: 'StayCentral',
    images: [
      {
        url: 'https://staycentral.app/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StayCentral - The Future of Hotel Management',
    description: 'Streamline hotel operations and enhance the guest experience with our all-in-one platform.',
    images: ['https://staycentral.app/twitter-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <FirebaseClientProvider>
                {children}
                <Toaster />
                <React.Suspense fallback={null}>
                  <PageLoader />
                </React.Suspense>
            </FirebaseClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
