// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import Head from 'next/head';
import {
  HiArrowNarrowRight,
  HiOutlineLightBulb,
  HiOutlineUserGroup
} from 'react-icons/hi';

import FeatureAutomate from '@/components/feature-automate';
import FeatureCollaborate from '@/components/feature-collaborate';
import FeatureCompare from '@/components/feature-compare';
import FeatureSubmit from '@/components/feature-submit';
import FeatureTestimonials, {
  TestimonialInput
} from '@/components/feature-testimonials';
import FooterCta from '@/components/footer-cta';
import SignupForm from '@/components/signup-form';
import { make_path } from '@/lib/api';
import { FeatureInput } from '@/lib/feature';

type PageContent = {
  announcement: {
    action: string;
    hidden: boolean;
    link: string;
    text: string;
  };
  pitch: {
    title: string;
    subtitle: string;
    elevator: string;
  };
  features: FeatureInput[];
  testimonials: TestimonialInput[];
};

const content: PageContent = {
  announcement: {
    action: 'Check it out on GitHub',
    hidden: false,
    link: 'https://github.com/trytouca/touca-java',
    text: 'We released our open-source Touca SDK for Java today.'
  },
  pitch: {
    title: 'See the side effects of your changes, as your write code.',
    subtitle: `Continuously test your software workflows to find
      the true impact of any code change during development.`,
    elevator:
      "Fixing silly mistakes shouldn't need a round-trip with your QA team."
  },
  features: [
    {
      title: 'Describe the behavior and performance of your workflow',
      description: `Use our open-source SDKs to capture values of
        variables and runtime of functions, for any number of test cases,
        from anywhere within your code.`,
      button: {
        link: 'https://docs.touca.io/basics/submit',
        text: 'Learn More',
        title: 'Learn how Touca helps you write regression test tools.'
      }
    },
    {
      icon: HiOutlineLightBulb,
      image: {
        link: make_path('/images/touca_landing_feature_2.png'),
        alt: 'Get notified when Touca finds regressions in your product.'
      },
      title: 'See how your description compares against your baseline',
      description: `We remotely compare your description against a previous trusted version
        of your software and report differences in near real-time.`,
      button: {
        link: 'https://docs.touca.io/basics/interpret',
        text: 'Learn More',
        title: 'Learn how Touca processes your results and reports regressions.'
      }
    },
    {
      icon: HiOutlineUserGroup,
      image: {
        link: make_path('/images/touca_landing_feature_3.png'),
        alt: 'Get notified when your team members promote the baseline version.'
      },
      title: 'Work as a team to fix discovered regressions',
      description: `Work as a team to resolve or justify new differences.
        Maintain a shared understanding of how your software is supposed
        to work.`,
      button: {
        link: 'https://docs.touca.io/basics/integrate',
        text: 'Learn More',
        title: 'Learn how to work as a team to deal with regressions.'
      }
    },
    {
      title: 'Continuously run Touca tests at any scale',
      description: `Automate the execution of your tests, locally or as part of
        your build pipeline, or on a dedicated test server; however you like,
        whenever you like. We give you real-time feedback, when you need it.`,
      button: {
        link: 'https://docs.touca.io/basics/automate',
        text: 'Learn More',
        title: 'Learn how to automate the execution of your tests tools.'
      }
    }
  ],
  testimonials: [
    {
      image: make_path('/images/touca-customer-testimonial-vital-profile.jpg'),
      title: 'Ben Jackson',
      subtitle: 'Principal Software Engineer at Vital Images, Inc.',
      quote: `"We use Touca to perform nightly regression tests of our critical
        workflows. When we make changes to complex software, we need to have
        confidence that there have been no unexpected consequences. Touca gives
        us that confidence by tracking millions of output values computed from
        thousands of input datasets and helping us understand exactly how those
        outputs have changed from one build to the next. That confidence gives
        us leverage to develop new features faster and with fewer problems."`,
      learnMore: {
        title: `Learn more about how Vital Images uses Touca`,
        text: "Read Vital Images' Story",
        link: 'https://docs.touca.io/stories/vital',
        hidden: true
      }
    }
  ]
};

export default function Home() {
  return (
    <>
      <Head>
        <title>Touca</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
      </Head>
      <section className="bg-gradient-to-b from-dark-blue-900 to-dark-blue-700">
        <div className="grid wsl-min-h-screen-1 lg:items-center">
          <div className="container flex items-center mx-auto">
            <div className="grid gap-8 px-8 lg:grid-cols-2 lg:items-center">
              <div className="flex flex-col justify-around h-full py-12 mx-auto space-y-4 text-white lg:py-4 xl:py-0 lg:space-y-8">
                <h2 className="max-w-xl text-4xl font-bold wsl-text-gradient wsl-text-shadow xl:text-5xl">
                  {content.pitch.title}
                </h2>
                <p className="max-w-xl text-2xl">{content.pitch.subtitle}</p>
                <div className="max-w-xl">
                  <SignupForm></SignupForm>
                </div>
                <div>
                  <a
                    href="https://calendly.com/ghorbanzade/30min"
                    target="_blank"
                    rel="noopener noreferrer">
                    <button
                      className="py-2 space-x-2 font-medium hover:underline focus:underline focus:outline-none group"
                      type="button"
                      role="button">
                      <span>Get a Live Demo</span>
                      <HiArrowNarrowRight className="inline h-4 opacity-50 group-hover:opacity-100"></HiArrowNarrowRight>
                    </button>
                  </a>
                </div>
                <div className="container mx-auto space-y-4">
                  <p className="text-white uppercase">Trusted By</p>
                  <div className="flex items-center justify-between space-x-2">
                    <a
                      href="https://vitalimages.com"
                      target="_blank"
                      rel="noopener noreferrer">
                      <img
                        className="text-gray-50"
                        src={make_path('/images/touca-customer-logo-vital.svg')}
                        alt="Vital Images, Inc."
                        loading="eager"
                      />
                    </a>
                  </div>
                </div>
              </div>
              <div className="items-center hidden w-full h-full max-w-screen-md col-span-1 px-8 pb-8 mx-auto select-none sm:flex lg:py-0 lg:px-4">
                <img
                  className="rounded-lg shadow-md"
                  alt="Touca Continuous Regression Testing"
                  src={make_path('/images/touca-atf-visual.png')}
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="bg-gradient-to-r from-dark-blue-900 via-dark-blue-800 to-dark-blue-800">
        {(content.announcement.hidden && (
          <p className="container p-8 mx-auto text-xl font-semibold text-center text-white">
            {content.pitch.elevator}
          </p>
        )) || (
          <p className="container p-8 mx-auto space-x-2 text-lg font-medium text-center text-white">
            <span>{content.announcement.text}</span>
            <a
              className="font-bold underline hover:text-gray-200 "
              href={content.announcement.link}>
              {content.announcement.action}
            </a>
          </p>
        )}
      </section>
      <section className="flex items-center wsl-min-h-screen-3 bg-gradient-to-b from-dark-blue-800 to-dark-blue-900">
        <div className="container mx-auto">
          <div className="max-w-5xl px-8 mx-auto text-white">
            <p className="py-4 text-3xl text-left lg:text-4xl">
              It takes{' '}
              <span className="font-medium text-yellow-500">23 days</span> for
              software engineers to gain confidence that a given code change
              works as they expect.
            </p>
            <p className="py-4 text-2xl text-right">
              Touca reduces this to{' '}
              <span className="text-yellow-500">minutes</span>.
            </p>
          </div>
        </div>
      </section>
      <FeatureSubmit input={content.features[0]}></FeatureSubmit>
      <FeatureCompare input={content.features[1]}></FeatureCompare>
      <FeatureCollaborate input={content.features[2]}></FeatureCollaborate>
      <FeatureAutomate input={content.features[3]}></FeatureAutomate>
      <FeatureTestimonials input={content.testimonials}></FeatureTestimonials>
      <section className="py-32 lg:pt-8 min-h-[25vh] flex items-center bg-dark-blue-800">
        <div className="container px-8 mx-auto md:px-24 lg:px-8">
          <FooterCta></FooterCta>
        </div>
      </section>
    </>
  );
}
