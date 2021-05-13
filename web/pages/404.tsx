/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import Head from 'next/head';
import Link from 'next/link';

const content = {
  title: 'Page Not Found',
  subtitle: 'Did you make a typo?',
  description: `
    The page or document you requested is not accessible. Either it does not
    exist or you have insufficient privileges to access it. Let us know if
    you think you are encountering this page by error.`
};

export default function NotFoundPage() {
  return (
    <>
      <Head>
        <title>Weasel - Page Not Found</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
      </Head>
      <section className="bg-gradient-to-b from-dark-blue-900 to-light-blue-900">
        <div className="px-4 wsl-min-h-screen-1 container mx-auto grid place-content-center space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-white text-4xl font-light">{content.title}</h2>
            <p className="text-xl text-white">{content.subtitle}</p>
          </div>
          <div className="p-8 mx-auto max-w-xl bg-dark-blue-800 bg-opacity-50 border border-dark-blue-700 rounded-xl space-y-8">
            <div className="">
              <p className="text-white text-lg md:text-xl font-light">
                {content.description}
              </p>
            </div>
            <div className="text-center">
              <Link href="/">
                <a className="wsl-header-btn-primary">Back to Main Page</a>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
