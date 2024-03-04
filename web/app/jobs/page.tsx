// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { Metadata } from 'next';
import Script from 'next/script';
import React from 'react';

export const metadata: Metadata = {
  title: 'Working at Touca',
  alternates: { canonical: '/jobs' },
  openGraph: {
    title: 'Working at Touca',
    description:
      'We are looking for a Samurai: Someone who is resilient, ambitious, and hungry for growth. Know anyone?',
    images: [
      {
        url: 'touca_banner_jobs.png',
        width: 906,
        height: 453,
        alt: 'Working at Touca',
        type: 'image/png'
      }
    ]
  }
};

export default function Page() {
  return (
    <>
      <Script id="redirect" strategy="afterInteractive">
        {`window.location.replace("https://touca.notion.site/Working-at-Touca-5881cf379db44551a805720269258137");`}
      </Script>
      <section className="bg-dark-blue-900">
        <div className="wsl-min-h-screen-1 container mx-auto flex flex-col justify-center">
          <div className="space-y-2 p-4 text-center">
            <h2 className="text-5xl font-extrabold text-white">
              Working at Touca
            </h2>
            <p className="text-3xl text-white">
              Redirecting you to our Notion page...
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
