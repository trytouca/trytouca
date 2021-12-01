// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import '@/styles/global.css';

import { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import Script from 'next/script';
import { useEffect } from 'react';

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
        </>
      )}
      <Script
        id="hs-script-loader"
        src="//js.hs-scripts.com/14530326.js"
        strategy="lazyOnload"
      />
      <Component {...pageProps} />
    </>
  );
}
