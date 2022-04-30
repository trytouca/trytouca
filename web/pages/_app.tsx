// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import '@/styles/global.css';

import { AppProps } from 'next/app';
import Script from 'next/script';
import { DefaultSeo } from 'next-seo';

const devEnv = process && process.env.NODE_ENV === 'development';

export default function App({ Component, pageProps }: AppProps) {
  return devEnv ? (
    <Component {...pageProps} />
  ) : (
    <>
      <Script
        async
        defer
        data-domain="touca.io"
        data-api="/api/event"
        src="/js/script.outbound-links.js"
      />
      <Script
        id="analytics-event-script"
        dangerouslySetInnerHTML={{
          __html: `window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }`
        }}
        strategy="afterInteractive"
      />
      <DefaultSeo
        defaultTitle="Touca"
        titleTemplate="Touca - %s"
        description="Touca is a continuous regression testing solution that helps software engineering teams gain confidence in their daily code changes."
        openGraph={{
          type: 'website',
          locale: 'en_US',
          site_name: 'Touca',
          url: 'https://touca.io/',
          title: 'Developer-friendly Continuous Regression Testing',
          description:
            'Touca is a continuous regression testing solution that helps software engineering teams gain confidence in their daily code changes.',
          images: [
            {
              url: 'https://touca.io/images/touca_open_graph_image.png',
              width: 906,
              height: 453,
              alt: 'Developer-friendly Continuous Regression Testing',
              type: 'image/png'
            }
          ]
        }}
        twitter={{
          handle: '@heypejman',
          site: '@trytouca',
          cardType: 'summary_large_image'
        }}
        additionalMetaTags={[
          {
            name: 'theme-color',
            content: '#1f2937'
          },
          {
            name: 'viewport',
            content: 'width=device-width, initial-scale=1, shrink-to-fit=no'
          }
        ]}
        additionalLinkTags={[
          {
            rel: 'icon',
            href: 'favicon.ico',
            type: 'image/x-icon'
          },
          {
            rel: 'apple-touch-icon',
            href: '/icons/apple-touch-icon.png'
          },
          {
            rel: 'manifest',
            href: '/manifest.json'
          }
        ]}
      />
      <Component {...pageProps} />
    </>
  );
}
