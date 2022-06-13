// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import Script from 'next/script';
import { BreadcrumbJsonLd, NextSeo } from 'next-seo';
import React from 'react';

import Header from '@/components/header';

export default function WebinarsPage() {
  return (
    <>
      <BreadcrumbJsonLd
        itemListElements={[{ position: 1, name: 'Touca Webinars' }]}
      />
      <NextSeo title="Touca Webinars" canonical="https://touca.io/webinars" />
      <Script id="redirect" strategy="afterInteractive">
        {`setTimeout(() => window.location.replace("https://youtube.com/playlist?list=PL5-_QXYHJoVQqCT-X8U9sr_xUPU2veuDr"), 2000);`}
      </Script>
      <Header></Header>
      <section className="bg-dark-blue-900">
        <div className="wsl-min-h-screen-1 container mx-auto flex flex-col justify-center">
          <div className="space-y-2 p-4 text-center">
            <h2 className="text-5xl font-extrabold text-white">
              Touca Webinars
            </h2>
            <p className="text-3xl text-white">
              Redirecting you to our YouTube page...
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
