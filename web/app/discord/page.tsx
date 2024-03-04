// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { Metadata } from 'next';
import Script from 'next/script';
import React from 'react';

export const metadata: Metadata = {
  title: 'Touca Discord Community',
  alternates: { canonical: '/discord' },
  openGraph: {
    title: 'Touca Discord Community',
    description:
      'Community Discord server to get support, collaborate with contributors, and make friends with fellow software engineers.',
    images: [
      {
        url: 'touca_banner_discord.png',
        width: 906,
        height: 453,
        alt: 'Touca Discord Community',
        type: 'image/png'
      }
    ]
  }
};

export default function Page() {
  return (
    <>
      <Script id="redirect" strategy="afterInteractive">
        {`setTimeout(() => window.location.replace("https://discord.com/invite/pTXKTVzPpA"), 2000);`}
      </Script>
      <section className="bg-dark-blue-900">
        <div className="wsl-min-h-screen-1 container mx-auto flex flex-col justify-center">
          <div className="space-y-2 p-4 text-center">
            <h2 className="text-5xl font-extrabold text-white">
              Touca Community
            </h2>
            <p className="text-3xl text-white">
              Redirecting you to our Discord Server...
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
