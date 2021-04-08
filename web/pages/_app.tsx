/**
 * Copyright 2021 Weasel, Inc. All rights reserved.
 */

import { AppProps } from 'next/app';
import '@/styles/global.css';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
