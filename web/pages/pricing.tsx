/**
 * Copyright 2021 Weasel, Inc. All rights reserved.
 */

import React from 'react';
import Head from 'next/head';
import { HiArrowNarrowRight } from 'react-icons/hi';
import FooterCta from '@/components/footer-cta';
import PricingPlan, { Input } from '@/components/pricing-plan';

interface PageContent {
  title: string;
  subtitle: string;
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
  title: 'Pricing that fits your size.',
  subtitle: 'Scale as you grow. Free forever for individuals and non-profits.',
  plans: [
    {
      title: 'Free',
      description: 'Up to 5 users',
      features: [
        'Unlimited Suites',
        'Unlimited Test Cases',
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
  ],
  faq: {
    title: 'Common Questions.',
    blocks: [
      {
        question: 'What professional services do you offer?',
        answer: [
          `At no extra charge, we offer teams on our paid plans online and
          on-site engineering support for tasks ranging from integrating our
          Client Libraries to deploying and upgrading their self-hosted
          Weasel Platform.`,
          `We reserve time every month to work with your team, to make sure
          you are getting the most value from our product.`
        ]
      },
      {
        question: 'What languages do you support?',
        answer: [
          `Weasel Platform is language agnostic. But you'd need to integrate
          one of our SDKs with your code to capture test results and submit
          them to the platform. At the moment, we only provide an SDK for the
          C++ programming language.`,
          `We are developing SDKs for Python, Java, and Javascript as part of
          our 2021 product roadmap. Our Python SDK is in its final evaluation
          phase and is scheduled to be released by May 2021.`
        ]
      },
      {
        question: 'How does self-hosting work?',
        answer: [
          `Organizations on our Enterprise plan have the option to deploy and
          run Weasel on-premise or on their private cloud network, if they
          prefer to do so. Self-hosting Weasel allows organizations to create
          as many teams as they require at no extra cost.`
        ]
      },
      {
        question: 'What is Platform API Access?',
        answer: [
          `API Access allows teams to integrate their own applications with
          the Weasel Platform to generate custom reports, trigger events, and
          programmatically import or export their submitted test results.`
        ]
      },
      {
        question: 'How can I get in touch with Weasel?',
        answer: [
          `You can always email us at support@getweasel.com or use our
          Contact Us page.`
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
      <>
        <div className="py-32 px-4 lg:px-8 wsl-min-h-screen-1 container mx-auto">
          <h2 className="pb-16 text-white text-4xl font-bold">
            {content.faq.title}
          </h2>
          <div className="grid lg:grid-cols-2 gap-8 xl:gap-16">
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
                    <h3 className="text-white text-xl lg:text-2xl text-medium">
                      {block.question}
                    </h3>
                    <HiArrowNarrowRight
                      className={`text-indigo-500 text-2xl ${right}`}
                    />
                  </div>
                );
              })}
            </div>
            <div className="grid-cols-1">
              <div className="p-8 bg-dark-blue-700 bg-opacity-20 rounded-lg space-y-4">
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
      </>
    );
  }
}

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
      <section className="bg-gradient-to-b from-dark-blue-900 via-dark-blue-800 to-dark-blue-800">
        <div className="wsl-min-h-screen-1 container mx-auto flex flex-col justify-center">
          <div className="p-8 space-y-2 text-center">
            <h2 className="text-white text-4xl font-extrabold">
              {content.title}
            </h2>
            <p className="text-xl text-white">{content.subtitle}</p>
          </div>
          <div className="p-8 auto-cols-fr">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="col-span-1">
                <PricingPlan plan={content.plans[0]}></PricingPlan>
              </div>
              <div className="col-span-1">
                <PricingPlan plan={content.plans[1]}></PricingPlan>
              </div>
              <div className="col-span-1">
                <PricingPlan plan={content.plans[2]}></PricingPlan>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="bg-dark-blue-900">
        <CommonQuestions></CommonQuestions>
      </section>
      <section className="py-8 min-h-[25vh] flex items-center bg-dark-blue-800">
        <div className="container mx-auto px-8 md:px-24 lg:px-8">
          <FooterCta></FooterCta>
        </div>
      </section>
    </>
  );
}
