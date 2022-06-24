// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import Script from 'next/script';
import { BreadcrumbJsonLd, NextSeo } from 'next-seo';
import React from 'react';

import Header from '@/components/header';

export default function TwitchPage() {
  return (
    <>
      <BreadcrumbJsonLd
        itemListElements={[{ position: 1, name: 'Touca Twitch Livestreams' }]}
      />
      <NextSeo
        title="Touca Twitch Livestreams"
        canonical="https://touca.io/twitch"
        openGraph={{
          type: 'website',
          locale: 'en_US',
          site_name: 'Touca',
          url: 'https://touca.io/',
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
        }}
      />
      <Script id="redirect" strategy="afterInteractive">
        {`setTimeout(() => window.location.replace("https://www.twitch.tv/trytouca"), 2000);`}
      </Script>
      <Header></Header>
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
