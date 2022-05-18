// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import Script from 'next/script';
import { BreadcrumbJsonLd, NextSeo } from 'next-seo';
import React from 'react';

import Header from '@/components/header';

export default function GitHubPage() {
  return (
    <>
      <BreadcrumbJsonLd
        itemListElements={[{ position: 1, name: 'Touca GitHub Repository' }]}
      />
      <NextSeo
        title="Touca GitHub Repository"
        canonical="https://touca.io/GitHub"
        openGraph={{
          type: 'website',
          locale: 'en_US',
          site_name: 'Touca',
          url: 'https://touca.io/',
          title: 'Touca GitHub Repository',
          description:
            'Open-source regression testing system that you can self-host',
          images: [
            {
              url: 'https://opengraph.githubassets.com/1/trytouca/trytouca',
              width: 791,
              height: 395,
              alt: 'Touca GitHub Repository',
              type: 'image/png'
            }
          ]
        }}
      />
      <Script id="redirect" strategy="afterInteractive">
        {`window.location.replace("https://github.com/trytouca/trytouca");`}
      </Script>
      <Header></Header>
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
