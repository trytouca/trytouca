// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import '@/styles/global.css';

import { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import Script from 'next/script';
import { useEffect } from 'react';

import { GTM_ID, tracker } from '@/lib/tracker';

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
      {tracker.enabled() && (
        <>
          <Script
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer',${GTM_ID});`
            }}
            strategy="afterInteractive"
          />
        </>
      )}
      <Component {...pageProps} />
    </>
  );
}
