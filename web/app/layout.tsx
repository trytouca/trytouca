// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import './globals.css';

import type { Metadata, Viewport } from 'next';

import Footer from '@/components/Footer';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: {
    default: 'Touca',
    template: 'Touca - %s'
  },
  description:
    'Touca is a continuous regression testing solution that helps software engineering teams gain confidence in their daily code changes.',
  metadataBase: new URL('https://touca.io'),
  alternates: { canonical: '/' },
  manifest: '/manifest.json',
  openGraph: {
    title: 'Developer-friendly Continuous Regression Testing',
    description:
      'Touca is a continuous regression testing solution that helps software engineering teams gain confidence in their daily code changes.',
    locale: 'en_US',
    siteName: 'Touca',
    type: 'website',
    url: '/',
    images: [
      {
        url: '/etc/touca-230222-open-graph-v2.png',
        width: 906,
        height: 453,
        alt: 'Continuous Regression Testing for Engineering Teams',
        type: 'image/png'
      }
    ]
  }
};

export const viewport: Viewport = {
  themeColor: '#1f2937'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-dark-blue-900 font-sans antialiased">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
