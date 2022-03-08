// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { WithRouterProps } from 'next/dist/client/with-router';
import Link from 'next/link';
import { withRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import React from 'react';

import Header from '@/components/header';
import { tracker } from '@/lib/tracker';

const content = {
  title: 'Page Not Found',
  subtitle: 'Did you make a typo?',
  description: `
    The page or document you requested is not accessible. Either it does not
    exist or you have insufficient privileges to access it. Let us know if
    you think you are encountering this page by error.`
};

class NotFoundPage extends React.Component<WithRouterProps> {
  componentDidMount(): void {
    tracker.track({ action: '404' }, { path: this.props.router.asPath });
  }
  render() {
    return (
      <>
        <NextSeo title="Page Not Found" />
        <Header></Header>
        <section className="bg-gradient-to-b from-dark-blue-900 to-dark-blue-800">
          <div className="wsl-min-h-screen-1 container mx-auto grid place-content-center space-y-12 px-4">
            <div className="space-y-2 text-center">
              <h2 className="text-4xl font-light text-white">
                {content.title}
              </h2>
              <p className="text-xl text-white">{content.subtitle}</p>
            </div>
            <div className="mx-auto max-w-xl space-y-8 rounded-xl border border-dark-blue-700 bg-dark-blue-800 bg-opacity-50 p-8">
              <div className="">
                <p className="text-lg font-light text-white md:text-xl">
                  {content.description}
                </p>
              </div>
              <div className="text-center">
                <Link href="/">
                  <a className="rounded-xl border border-transparent bg-sky-900 bg-opacity-50 p-4 text-sm leading-6 text-gray-300 hover:border-sky-900 hover:text-white">
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
}

export default withRouter(NotFoundPage);
