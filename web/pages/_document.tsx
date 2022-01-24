// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import Document, { Head, Html, Main, NextScript } from 'next/document';

import Footer from '@/components/footer';
import { make_path } from '@/lib/api';

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <base href="/" />
          <meta charSet="utf-8" />
          <meta name="theme-color" content="#1f2937" />
          <meta property="og:locale" content="en_US" />
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="Touca" />
          <meta
            property="og:image"
            content="https://touca.io/images/touca_open_graph_image.png"
          />
          <meta
            property="og:image:alt"
            content="Developer-focused Continuous Regression Testing"
          />
          <meta property="og:url" content="https://touca.io" />
          <meta
            property="og:title"
            content="Developer-focused Continuous Regression Testing"
          />
          <meta
            property="og:description"
            name="description"
            content="See the side-effects of your changes, as you write code."
          />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:site" content="@trytouca" />
          <meta name="twitter:creator" content="@heypejman" />
          <link rel="manifest" href="/manifest.json" />
          <link rel="icon" type="image/x-icon" href="favicon.ico" />
          <link
            rel="apple-touch-icon"
            href={make_path('/icons/apple-touch-icon.png')}
          />
        </Head>
        <body className="min-h-screen bg-dark-blue-900 font-sans antialiased">
          <Main />
          <Footer></Footer>
          <NextScript />
        </body>
      </Html>
    );
  }
}
