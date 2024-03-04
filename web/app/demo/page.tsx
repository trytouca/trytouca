// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { Metadata } from 'next';
import Script from 'next/script';
import React from 'react';

export const metadata: Metadata = {
  title: 'Touca Product Demo',
  alternates: { canonical: '/demo' }
};

export default function Page() {
  return (
    <>
      <Script id="redirect" strategy="afterInteractive">
        {`setTimeout(() => window.location.replace("https://calendly.com/ghorbanzade/30min"), 2000);`}
      </Script>
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
