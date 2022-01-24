// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import Head from 'next/head';
import React from 'react';
import { HiArrowNarrowRight } from 'react-icons/hi';

import Header from '@/components/header';
import PricingPlan, { Input } from '@/components/pricing-plan';

interface PageContent {
  plans: Input[];
  faq: {
    title: string;
    blocks: {
      question: string;
      answer: string[];
    }[];
  };
}

const content: PageContent = {
  plans: [
    {
      title: 'Cloud-Hosted',
      features: ['Unlimited test results', '2-year data retention'],
      fee: {
        class: 'text-7xl text-sky-200',
        suffix: ['per user', 'per month'],
        text: '$25'
      }
    },
    {
      title: 'Self-Hosted',
      features: ['Custom contracts', 'Professional services'],
      fee: {
        class: 'text-4xl md:text-5xl text-gray-200',
        suffix: ['per year'],
        text: '$10,000'
      }
    }
  ],
  faq: {
    title: 'Common Questions',
    blocks: [
      {
        question: 'What professional services do you offer?',
        answer: [
          `At no extra charge, we offer teams on our paid plans online and
          on-site engineering support for tasks ranging from integrating our
          SDK libraries to deploying and upgrading their self-hosted
          Touca server.`,
          `We reserve time every month to work with your team, to make sure
          you are getting the most value from our product.`
        ]
      },
      {
        question: 'What languages do you support?',
        answer: [
          `Touca server is language agnostic. But you'd need to integrate one
          of our SDKs with your code to describe the behavior and performance
          of your code by capturing actual values of variables and runtime of
          functions.`,
          `At the moment, we provide SDKs for C++, Python, Java, and JavaScript
          programming languages.`
        ]
      },
      {
        question: 'How does self-hosting work?',
        answer: [
          `Teams on our Enterprise plan have the option to deploy and
          run Touca on-premise or on their private cloud network, if they
          prefer to do so. Self-hosting allows organizations to create as
          many teams as they require at no extra cost.`
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
          `You can always email us at hello@touca.io or use our Contact Us page.`
        ]
      }
    ]
  }
};

class CommonQuestions extends React.Component<
  Record<string, never>,
  { activeIndex: number }
> {
  constructor(props) {
    super(props);
    this.state = { activeIndex: 0 };
    this.activate = this.activate.bind(this);
  }

  activate(index: number) {
    this.setState({ activeIndex: index });
  }

  render() {
    return (
      <div className="container flex flex-col justify-center px-4 py-32 mx-auto lg:px-8 wsl-min-h-screen-1">
        <h2 className="pb-16 text-4xl font-bold text-white">
          {content.faq.title}
        </h2>
        <div className="grid gap-8 lg:grid-cols-2 xl:gap-16">
          <div className="grid-cols-1 space-y-2">
            {content.faq.blocks.map((block, index) => {
              const isActive = index === this.state.activeIndex;
              const left = isActive
                ? 'bg-dark-blue-700 bg-opacity-20'
                : 'hover:bg-dark-blue-700 hover:bg-opacity-10';
              const right = isActive ? '' : 'hidden';
              return (
                <div
                  key={index}
                  onClick={() => this.activate(index)}
                  className={`p-4 flex items-center justify-between rounded-lg cursor-pointer duration-300 ease-in-out ${left}`}>
                  <h3 className="text-xl text-white lg:text-2xl text-medium">
                    {block.question}
                  </h3>
                  <HiArrowNarrowRight
                    className={`text-yellow-500 text-2xl ${right}`}
                  />
                </div>
              );
            })}
          </div>
          <div className="grid-cols-1">
            <div className="p-8 space-y-4 rounded-lg bg-dark-blue-700 bg-opacity-20">
              {content.faq.blocks[this.state.activeIndex].answer.map(
                (text, index) => (
                  <p key={index} className="text-xl text-gray-300">
                    {text}
                  </p>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

function FreePlan() {
  return (
    <div className="w-full max-w-screen-lg px-8 mx-auto">
      <div className="p-8 space-y-8 border rounded-lg shadow-xl md:space-y-0 md:flex md:items-center md:justify-between bg-opacity-90 bg-dark-blue-800 border-dark-blue-700">
        <div className="space-y-2 text-white">
          <p className="text-2xl font-bold">Just you?</p>
          <p className="text-xl font-medium">
            Touca is <span className="font-semibold text-yellow-500">free</span>{' '}
            forever for individual use.
          </p>
        </div>
        <a
          className="block text-lg"
          href="https://app.touca.io"
          target="_blank"
          rel="noopener noreferrer">
          <button
            className="shadow-[0_0_5px_#7dd3fc] p-3 space-x-2 font-medium text-white duration-150 ease-in-out bg-opacity-25 box-shadow rounded-xl focus:outline-none bg-dark-blue-700 hover:bg-opacity-50 group"
            type="button"
            role="button">
            <span>Get Started for Free</span>
            <HiArrowNarrowRight className="inline h-6 opacity-50 group-hover:opacity-100"></HiArrowNarrowRight>
          </button>
        </a>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <>
      <Head>
        <title>Touca Pricing</title>
        <link rel="canonical" href="https://touca.io/pricing" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
      </Head>
      <Header></Header>
      <section className="bg-gradient-to-b from-dark-blue-900 via-dark-blue-800 to-dark-blue-800">
        <div className="container flex flex-col justify-center w-full max-w-screen-lg py-16 mx-auto wsl-min-h-screen-1">
          <div className="flex items-center min-h-[25vh] p-8 space-y-2 text-center">
            <h2 className="max-w-2xl mx-auto text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">
              <span className="text-yellow-500">Pays for itself</span> in
              happier, more productive engineers
            </h2>
          </div>
          <div className="p-8 auto-cols-fr">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="col-span-1">
                <PricingPlan plan={content.plans[0]}></PricingPlan>
              </div>
              <div className="col-span-1 py-2">
                <PricingPlan plan={content.plans[1]}></PricingPlan>
              </div>
            </div>
          </div>
          <FreePlan></FreePlan>
        </div>
      </section>
      <section className="bg-dark-blue-900">
        <CommonQuestions></CommonQuestions>
      </section>
    </>
  );
}
