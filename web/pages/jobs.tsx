// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import Script from 'next/script';
import { BreadcrumbJsonLd, NextSeo } from 'next-seo';
import React from 'react';

import Header from '@/components/header';

export default function JobsPage() {
  return (
    <>
      <BreadcrumbJsonLd
        itemListElements={[{ position: 1, name: 'Working at Touca' }]}
      />
      <NextSeo title="Working at Touca" canonical="https://touca.io/jobs" />
      <Script id="redirect" strategy="afterInteractive">
        {`window.location.replace("https://touca.notion.site/Working-at-Touca-5881cf379db44551a805720269258137");`}
      </Script>
      <Header></Header>
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
