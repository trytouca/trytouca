// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { Metadata } from 'next';
import Script from 'next/script';
import React from 'react';

export const metadata: Metadata = {
  title: 'Touca GitHub Repository',
  alternates: { canonical: '/github' },
  openGraph: {
    title: 'Touca GitHub Repository',
    description:
      'Open-source continuous regression testing for engineering teams',
    images: [
      {
        url: 'https://opengraph.githubassets.com/1/trytouca/trytouca',
        width: 791,
        height: 395,
        alt: 'Touca GitHub Repository',
        type: 'image/png'
      }
    ]
  }
};

export default function Page() {
  return (
    <>
      <Script id="redirect" strategy="afterInteractive">
        {`window.location.replace("https://github.com/trytouca/trytouca");`}
      </Script>
      <section className="bg-dark-blue-900">
        <div className="wsl-min-h-screen-1 container mx-auto flex flex-col justify-center">
          <div className="space-y-2 p-4 text-center">
            <h2 className="text-5xl font-extrabold text-white">
              Touca GitHub Repository
            </h2>
            <p className="text-3xl text-white">
              Redirecting you to our GitHub repo...
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
