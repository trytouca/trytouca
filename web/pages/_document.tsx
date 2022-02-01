// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import Document, { Head, Html, Main, NextScript } from 'next/document';

import Footer from '@/components/footer';

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <base href="/" />
          <meta charSet="utf-8" />
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
