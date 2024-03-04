// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import { Metadata } from 'next';
import React from 'react';
import { HiArrowNarrowRight } from 'react-icons/hi';

import CommonQuestions from '@/components/pricing/CommonQuestions';
import PricingPlan from '@/components/pricing/PricingPlan';

const content = {
  plans: [
    {
      title: 'Teams',
      features: [
        'Collaborative features',
        'High-level insights',
        'White glove onboarding'
      ],
      fee: {
        class: 'text-6xl md:text-7xl text-sky-200',
        suffix: ['per seat', 'per month'],
        text: '$25'
      }
    },
    {
      title: 'Enterprises',
      features: [
        'Custom contracts',
        'Dedicated support',
        'Reduced per-seat pricing'
      ],
      fee: {
        prefix: 'Starting at',
        class: 'text-4xl md:text-5xl text-white',
        suffix: ['per month'],
        text: '$1000'
      }
    }
  ],
  faq: {
    title: 'Common Questions',
    blocks: [
      {
        question: 'How does self-hosting work?',
        answer: [
          `Touca Server is available on GitHub under Apache-2.0 license.
          You can install and run it locally, on-premise or in your own
          private cloud account.`,
          `So what's the catch? None. You'd just need to do the hosting,
          maintaining, and upgrading your instance. If you had questions
          or needed help, our Discord Community is still there to help you.`
        ]
      },
      {
        question: 'What languages do you support?',
        answer: [
          `Touca Server is language agnostic. You can submit test results
          using our CLI.`,
          `For more complex workflows, you can integrate one of our SDKs to
          allow capturing more information about the behavior and performance
          of your code. We have SDKs for C++, Python, Java, and JavaScript.`
        ]
      },
      {
        question: 'What professional services do you offer?',
        answer: [
          `We can provide online and on-site engineering support for tasks
          ranging from deploying, maintaining, and upgrading self-hosted
          instances to integrating our SDK libraries and setting up
          customized test infrastructure to match your needs.`,
          `For all paying customers, we reserve time every month to work with
          your team to make sure you are getting the most value from our product.`
        ]
      },
      {
        question: 'What is Server API Access?',
        answer: [
          `API Access allows teams to integrate their own applications with
          Touca to generate custom reports, trigger events, and
          programmatically import or export their submitted test results.`
        ]
      },
      {
        question: 'How can I get in touch with Touca?',
        answer: [
          `Join our community on Discord or email us at hello@touca.io or
          drop us a note from the Contact Us page.`
        ]
      }
    ]
  }
};

function FreePlan() {
  return (
    <div className="mx-auto w-full max-w-screen-lg px-8">
      <div className="space-y-8 rounded-lg border border-dark-blue-700 bg-dark-blue-800 bg-opacity-90 p-8 shadow-xl md:flex md:items-center md:justify-between md:space-y-0">
        <div className="space-y-2 text-white">
          <p className="text-2xl font-bold">Just you?</p>
          <p className="text-xl font-medium">
            Touca Cloud is{' '}
            <span className="font-semibold text-yellow-500">free</span> forever
            for individual use.
          </p>
        </div>
        <SpecialButton
          input={{
            href: 'https://app.touca.io',
            text: 'Get Started for Free'
          }}
        />
      </div>
    </div>
  );
}

function SpecialButton(props: { input: { href: string; text: string } }) {
  return (
    <a
      className="block text-lg"
      href={props.input.href}
      target="_blank"
      rel="noopener noreferrer">
      <button
        className="box-shadow group space-x-2 rounded-xl bg-dark-blue-700 bg-opacity-25 p-3 font-medium text-white shadow-[0_0_5px_#7dd3fc] duration-150 ease-in-out hover:bg-opacity-50 focus:outline-none"
        type="button"
        role="button">
        <span>{props.input.text}</span>
        <HiArrowNarrowRight className="inline h-6 opacity-50 group-hover:opacity-100" />
      </button>
    </a>
  );
}

export const metadata: Metadata = {
  title: 'Pricing',
  alternates: { canonical: '/pricing' }
};

export default function PricingPage() {
  return (
    <>
      {/* <BreadcrumbJsonLd
        itemListElements={[{ position: 1, name: 'Touca Pricing' }]}
      />
      <NextSeo title="Pricing" canonical="https://touca.io/pricing" />
      <FAQPageJsonLd mainEntity={mainEntity} />
      <Header /> */}
      <section className="bg-gradient-to-b from-dark-blue-900 via-dark-blue-800 to-dark-blue-800">
        <div className="wsl-min-h-screen-1 container mx-auto flex w-full max-w-screen-lg flex-col justify-center py-16">
          <div className="flex min-h-[25vh] items-center space-y-2 p-8 text-center">
            <p className="mx-auto max-w-2xl text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">
              <span className="bg-gradient-to-r from-yellow-500 to-yellow-300 bg-clip-text font-extrabold text-transparent">
                Pays for itself
              </span>{' '}
              in confident, more productive engineers
            </p>
          </div>
          <div className="auto-cols-fr p-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {content.plans.map((plan, index) => (
                <div key={index} className="col-span-1">
                  <PricingPlan plan={plan} />
                </div>
              ))}
            </div>
          </div>
          <FreePlan />
        </div>
      </section>
      <section className="bg-dark-blue-900">
        <CommonQuestions content={content.faq} />
      </section>
    </>
  );
}
