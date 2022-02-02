// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import '@/styles/global.css';

import { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import Script from 'next/script';
import { DefaultSeo } from 'next-seo';
import { useEffect } from 'react';

import { make_path } from '@/lib/api';
import { GA_TRACKING_ID, tracker } from '@/lib/tracker';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      tracker.view(url);
    };
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  return (
    <>
      {!!GA_TRACKING_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
            strategy="afterInteractive"
          />
          <Script
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_TRACKING_ID}', { page_path: window.location.pathname });`
            }}
            strategy="afterInteractive"
          />
          <Script
            id="hs-script-loader"
            src="//js.hs-scripts.com/14530326.js"
            strategy="lazyOnload"
          />
        </>
      )}
      <DefaultSeo
        defaultTitle="Touca"
        titleTemplate="Touca - %s"
        description="See the side-effects of your changes, as you write code."
        openGraph={{
          type: 'website',
          locale: 'en_US',
          site_name: 'Touca',
          url: 'https://touca.io/',
          title: 'Developer-focused Continuous Regression Testing',
          description:
            'See the side-effects of your changes, as you write code.',
          images: [
            {
              url: 'https://touca.io/images/touca_open_graph_image.png',
              width: 453,
              height: 906,
              alt: 'Developer-focused Continuous Regression Testing',
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
            href: make_path('/icons/apple-touch-icon.png')
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
