/**
 * Copyright 2021 Weasel, Inc. All rights reserved.
 */

import '@/styles/global.css';

import { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { pageview as gtag_pageview } from '@/lib/gtag';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      gtag_pageview(url);
    };
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  return <Component {...pageProps} />;
}
