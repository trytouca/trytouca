/**
 * Copyright 2021 Weasel, Inc. All rights reserved.
 */

import Head from 'next/head';

export default function PricingPage() {
  return (
    <>
      <Head>
        <title>Weasel Pricing</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
      </Head>
      <section className="bg-gradient-to-b from-dark-blue-900 to-dark-blue-800">
        <div className="wsl-min-h-screen-1">
          <div className="p-8 text-center">
            <h2 className="text-4xl text-white font-extrabold">Contact Us</h2>
          </div>
          <div className="p-8 bg-dark-blue-800 bg-opacity-75 rounded-lg shadow-lg"></div>
        </div>
      </section>
    </>
  );
}
