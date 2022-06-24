// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { BreadcrumbJsonLd, FAQPageJsonLd, NextSeo } from 'next-seo';
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
      title: 'Self-Hosted',
      features: ['Apache-2.0 License', 'Community Support', 'No Usage Limits'],
      fee: {
        class: 'text-4xl md:text-5xl text-gray-200',
        suffix: [],
        text: '$0'
      }
    },
    {
      title: 'Cloud-Hosted',
      features: [
        'Enterprise-Ready',
        'Dedicated Support',
        'Professional Services'
      ],
      fee: {
        class: 'text-7xl text-sky-200',
        suffix: ['per user', 'per month'],
        text: '$25'
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
      <div className="wsl-min-h-screen-1 container mx-auto flex flex-col justify-center px-4 py-32 lg:px-8">
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
                  className={`flex cursor-pointer items-center justify-between rounded-lg p-4 duration-300 ease-in-out ${left}`}>
                  <h3 className="text-medium text-xl text-white lg:text-2xl">
                    {block.question}
                  </h3>
                  <HiArrowNarrowRight
                    className={`text-2xl text-yellow-500 ${right}`}
                  />
                </div>
              );
            })}
          </div>
          <div className="grid-cols-1">
            <div className="space-y-4 rounded-lg bg-dark-blue-700 bg-opacity-20 p-8">
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
        <PlanButton></PlanButton>
      </div>
    </div>
  );
}

function PlanButton() {
  return (
    <a
      className="block text-lg"
      href="https://app.touca.io"
      target="_blank"
      rel="noopener noreferrer">
      <button
        className="box-shadow group space-x-2 rounded-xl bg-dark-blue-700 bg-opacity-25 p-3 font-medium text-white shadow-[0_0_5px_#7dd3fc] duration-150 ease-in-out hover:bg-opacity-50 focus:outline-none"
        type="button"
        role="button">
        <span>Get Started for Free</span>
        <HiArrowNarrowRight className="inline h-6 opacity-50 group-hover:opacity-100"></HiArrowNarrowRight>
      </button>
    </a>
  );
}

export default function PricingPage() {
  const mainEntity = content.faq.blocks.map((v) => ({
    questionName: v.question,
    acceptedAnswerText: v.answer
      .map((k) =>
        k
          .split('\n')
          .map((u) => u.trim())
          .join(' ')
      )
      .join(' ')
  }));
  return (
    <>
      <BreadcrumbJsonLd
        itemListElements={[{ position: 1, name: 'Touca Pricing' }]}
      />
      <NextSeo title="Pricing" canonical="https://touca.io/pricing" />
      <FAQPageJsonLd mainEntity={mainEntity} />
      <Header></Header>
      <section className="bg-gradient-to-b from-dark-blue-900 via-dark-blue-800 to-dark-blue-800">
        <div className="wsl-min-h-screen-1 container mx-auto flex w-full max-w-screen-lg flex-col justify-center py-16">
          <div className="flex min-h-[25vh] items-center space-y-2 p-8 text-center">
            <p className="mx-auto max-w-2xl text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">
              Use Touca for <span className="text-yellow-500">Free</span>.
              <br />
              Pay when it makes sense to.
            </p>
          </div>
          <div className="auto-cols-fr p-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="col-span-1 py-2">
                <PricingPlan plan={content.plans[0]}></PricingPlan>
              </div>
              <div className="col-span-1">
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
