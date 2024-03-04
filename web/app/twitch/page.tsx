// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { Metadata } from 'next';
import Script from 'next/script';
import React from 'react';

export const metadata: Metadata = {
  title: 'Touca Twitch Livestreams',
  alternates: { canonical: '/twitch' },
  openGraph: {
    title: 'Touca Twitch Livestreams',
    description:
      'Open-source continuous regression testing for engineering teams',
    images: [
      {
        url: 'touca_banner_twitch.png',
        width: 906,
        height: 453,
        alt: 'Touca Twitch Livestreams',
        type: 'image/png'
      }
    ]
  }
};

export default function Page() {
  return (
    <>
      <Script id="redirect" strategy="afterInteractive">
        {`setTimeout(() => window.location.replace("https://www.twitch.tv/trytouca"), 2000);`}
      </Script>
      <section className="bg-dark-blue-900">
        <div className="wsl-min-h-screen-1 container mx-auto flex flex-col justify-center">
          <div className="space-y-2 p-4 text-center">
            <h2 className="text-5xl font-extrabold text-white">
              Touca Twitch Livestreams
            </h2>
            <p className="text-3xl text-white">
              Redirecting you to our Twitch channel...
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
