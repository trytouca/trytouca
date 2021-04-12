/**
 * Copyright 2021 Weasel, Inc. All rights reserved.
 */

import Document, { Html, Head, Main, NextScript } from 'next/document';
import Footer from '@/components/footer';
import { GA_TRACKING_ID } from '@/lib/gtag';
import Header from '@/components/header';

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <base href="/" />
          <meta name="theme-color" content="#0284C7" />
          <meta property="og:locale" content="en_US" />
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="Weasel" />
          <meta
            property="og:image"
            content="https://getweasel.com/images/weasel_open_graph_image.png"
          />
          <meta
            property="og:image:alt"
            content="Weasel Continuous Regression Testing Platform"
          />
          <meta property="og:url" content="https://getweasel.com" />
          <meta
            property="og:title"
            content="Weasel Continuous Regression Testing Platform"
          />
          <meta
            property="og:description"
            name="description"
            content="Continuous regression testing for critical software workflows."
          />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:site" content="@getweasel" />
          <meta name="twitter:creator" content="@heypejman" />
          <link rel="canonical" href="https://getweasel.com" />
          <link rel="icon" type="image/x-icon" href="favicon.ico" />
          <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />

          <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_TRACKING_ID}', { page_path: window.location.pathname });`
            }}
          />
        </Head>
        <body className="font-sans antialiased min-h-screen bg-dark-blue-900">
          <Header></Header>
          <Main />
          <Footer></Footer>
          <NextScript />
        </body>
      </Html>
    );
  }
}
