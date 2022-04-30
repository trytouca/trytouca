// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import Script from 'next/script';
import { NextSeo } from 'next-seo';
import React from 'react';

import Header from '@/components/header';

export default function CalendlyPage() {
  return (
    <>
      <NextSeo title="Touca Product Demo" canonical="https://touca.io/demo" />
      <Script id="redirect" strategy="afterInteractive">
        {`setTimeout(() => window.location.replace("https://calendly.com/ghorbanzade/30min"), 2000);`}
      </Script>
      <Header></Header>
      <section className="bg-dark-blue-900">
        <div className="wsl-min-h-screen-1 container mx-auto flex flex-col justify-center">
          <div className="space-y-2 p-4 text-center">
            <h2 className="text-5xl font-extrabold text-white">
              Schedule a Demo
            </h2>
            <p className="text-3xl text-white">
              Redirecting you to our Calendly page...
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
