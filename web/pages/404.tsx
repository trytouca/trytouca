// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

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
        <title>Touca - Page Not Found</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
      </Head>
      <section className="bg-gradient-to-b from-dark-blue-900 to-sky-900">
        <div className="container grid px-4 mx-auto space-y-12 wsl-min-h-screen place-content-center">
          <div className="space-y-2 text-center">
            <h2 className="text-4xl font-light text-white">{content.title}</h2>
            <p className="text-xl text-white">{content.subtitle}</p>
          </div>
          <div className="max-w-xl p-8 mx-auto space-y-8 bg-opacity-50 border bg-dark-blue-800 border-dark-blue-700 rounded-xl">
            <div className="">
              <p className="text-lg font-light text-white md:text-xl">
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
