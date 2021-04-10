/**
 * Copyright 2021 Weasel, Inc. All rights reserved.
 */

import Head from 'next/head';
import FooterCta from '@/components/footer-cta';
import PricingPlan, { Input } from '@/components/pricing-plan';

const plans: Input[] = [
  {
    title: 'Free',
    description: 'Up to 5 users',
    features: [
      'Unlimited Suites',
      '100 Test Cases per Suite',
      '50 versions per month',
      '1 Month Data Retention'
    ],
    fee: 0,
    button: {
      title: 'Get Started',
      link: 'https://app.getweasel.com/account/signup?plan=free'
    }
  },
  {
    title: 'Startup',
    fee: 25,
    description: 'Up to 20 users',
    features: [
      'Unlimited Suites',
      'Unlimited Test Cases',
      '500 versions per month',
      '2 Years Data Retention',
      'Platform API Access',
      'Professional Services'
    ],
    button: {
      title: 'Get Started',
      link: 'https://app.getweasel.com/account/signup?plan=startup'
    }
  },
  {
    title: 'Enterprise',
    description: 'Unlimited Users',
    features: [
      'Unlimited Suites',
      'Unlimited Test Cases',
      'Unlimited Versions',
      'Unlimited Data Retention',
      'Platform API Access',
      'Professional Services',
      'Self-Hosting Option'
    ],
    button: {
      title: 'Contact Us',
      link: 'mailto:support@getweasel.com'
    }
  }
];

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
      <section className="bg-gradient-to-b from-dark-blue-900 via-dark-blue-900 to-light-blue-900">
        <div className="wsl-min-h-screen-1 container mx-auto">
          <div className="p-8 space-y-2 text-center">
            <h2 className="text-white text-4xl font-extrabold">
              Pricing that fits your size.
            </h2>
            <p className="text-xl text-white">
              Scale as you grow. Free forever for individuals and non-profits.
            </p>
          </div>
          <div className="p-8 auto-cols-fr">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="col-span-1">
                <PricingPlan plan={plans[0]}></PricingPlan>
              </div>
              <div className="col-span-1">
                <PricingPlan plan={plans[1]}></PricingPlan>
              </div>
              <div className="col-span-1">
                <PricingPlan plan={plans[2]}></PricingPlan>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-8 min-h-[25vh] flex items-center bg-dark-blue-800">
        <div className="container mx-auto px-8 md:px-24 lg:px-8">
          <FooterCta></FooterCta>
        </div>
      </section>
    </>
  );
}
