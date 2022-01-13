// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import Head from 'next/head';
import Link from 'next/link';

import Header from '@/components/header';

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
      <Header></Header>
      <section className="bg-gradient-to-b from-dark-blue-900 to-dark-blue-800">
        <div className="container grid px-4 mx-auto space-y-12 wsl-min-h-screen-1 place-content-center">
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
                <a className="p-4 text-sm leading-6 text-gray-300 bg-opacity-50 border border-transparent hover:text-white bg-sky-900 rounded-xl hover:border-sky-900">
                  Back to Main Page
                </a>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
