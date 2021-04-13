/**
 * Copyright 2021 Weasel, Inc. All rights reserved.
 */

import Head from 'next/head';
import { IconType } from 'react-icons';
import { FaCity } from 'react-icons/fa';
import {
  HiArrowNarrowRight,
  HiOutlineBadgeCheck,
  HiOutlineCog,
  HiOutlineLightBulb,
  HiOutlineUpload,
  HiOutlineUserGroup
} from 'react-icons/hi';
import FooterCta from '@/components/footer-cta';
import SignupForm from '@/components/signup-form';
import { make_path } from '@/lib/api';

type TestimonialInput = {
  image: string;
  title: string;
  subtitle: string;
  quote: string;
  learnMore: {
    title: string;
    text: string;
    link: string;
    hidden: boolean;
  };
};

type FeatureInput = {
  icon: IconType;
  image?: string;
  title: string;
  description: string;
  button: {
    link: string;
    text: string;
    title: string;
  };
};

type SidePitchInput = {
  title: string;
  description: string;
};

type PageContent = {
  features: FeatureInput[];
  sidePitches: SidePitchInput[];
  testimonials: TestimonialInput[];
};

const DimButton = (props: Record<'link' | 'text' | 'title', string>) => {
  return (
    <a href={props.link} title={props.title} target="_blank">
      <button
        className="px-4 py-2 bg-dark-blue-700 bg-opacity-25 text-light-blue-600 hover:text-light-blue-500 font-medium rounded-full space-x-1 focus:underline focus:outline-none group"
        type="button"
        role="button">
        <span className="text-sm leading-6 font-medium">{props.text}</span>
        <HiArrowNarrowRight className="inline h-6 opacity-50 group-hover:opacity-100"></HiArrowNarrowRight>
      </button>
    </a>
  );
};

const SidePitch = (props: { input: SidePitchInput }) => {
  return (
    <>
      <div className="p-8 col-span-1 bg-dark-blue-700 bg-opacity-30 rounded-xl shadow-2xl space-y-4">
        <div className="flex items-center space-x-2">
          <HiOutlineBadgeCheck className="text-light-blue-700" size="2rem" />
          <p className="text-3xl text-white font-semibold">
            {props.input.title}
          </p>
        </div>
        <p className="pl-10 text-2xl text-gray-200">
          {props.input.description}
        </p>
      </div>
    </>
  );
};

const Feature = (props: { input: FeatureInput }) => {
  const Icon = props.input.icon;
  return (
    <>
      <div className="flex items-center space-x-2">
        <Icon className="text-light-blue-600" size="3rem"></Icon>
        <h3 className="text-4xl xl:text-5xl text-white font-bold">
          {props.input.title}
        </h3>
      </div>
      <p className="text-2xl text-gray-300">{props.input.description}</p>
      <div>
        <DimButton
          link={props.input.button.link}
          text={props.input.button.text}
          title={props.input.button.title}></DimButton>
      </div>
    </>
  );
};

const FeatureHero = (props: { input: FeatureInput }) => {
  return (
    <div className="flex justify-center items-center">
      <div className="md:p-4 xl:p-6 w-full bg-gradient-to-b from-dark-blue-800 to-dark-blue-900 rounded-xl">
        <img
          className="mx-auto w-full rounded-md md:rounded-xl"
          src={props.input.image}
        />
      </div>
    </div>
  );
};

const Testimonial = (props: { input: TestimonialInput }) => {
  return (
    <div className="bg-dark-blue-800 bg-opacity-75 p-8 rounded-lg shadow-xl space-y-4">
      <figcaption className="flex items-center space-x-4">
        <img className="w-20 h-20 rounded-2xl" src={props.input.image} />
        <div className="font-medium">
          <div className="text-lg text-white">{props.input.title}</div>
          <div className="text-light-blue-600 text-base">
            {props.input.subtitle}
          </div>
        </div>
      </figcaption>
      <blockquote className="text-gray-300 text-xl">
        <p>{props.input.quote}</p>
      </blockquote>
      {!props.input.learnMore.hidden && (
        <div className="text-right">
          <DimButton
            link={props.input.learnMore.link}
            text={props.input.learnMore.text}
            title={props.input.title}></DimButton>
        </div>
      )}
    </div>
  );
};

const content: PageContent = {
  features: [
    {
      icon: HiOutlineUpload,
      image: make_path('/images/weasel_landing_feature_1.png'),
      title: 'Submit',
      description: `Use our client libraries to capture values of important
        variables and runtime of functions, for any number of test cases,
        from anywhere within your code.`,
      button: {
        link: 'https://docs.getweasel.com/guides/submit',
        text: 'Learn More',
        title: 'Learn how Weasel helps you write regression test tools.'
      }
    },
    {
      icon: HiOutlineLightBulb,
      image: make_path('/images/weasel_landing_feature_2.png'),
      title: 'Interpret',
      description: `We compare your results against your baseline version and
        report any changes in behavior or performance.`,
      button: {
        link: 'https://docs.getweasel.com/guides/interpret',
        text: 'Learn More',
        title:
          'Learn how Weasel processes your results and reports regressions.'
      }
    },
    {
      icon: HiOutlineUserGroup,
      image: make_path('/images/weasel_landing_feature_3.png'),
      title: 'Collaborate',
      description: `Work as a team to resolve or justify new differences.
        Maintain a shared understanding of how your software is supposed
        to work.`,
      button: {
        link: 'https://docs.getweasel.com/guides/collaborate',
        text: 'Learn More',
        title: 'Learn how to work as a team to deal with regressions.'
      }
    },
    {
      icon: HiOutlineCog,
      image: make_path('/images/weasel_landing_feature_4.png'),
      title: 'Automate',
      description: `Use our testing frameworks to automate your regression tests
        and manage their execution through our platform.`,
      button: {
        link: 'https://docs.getweasel.com/guides/automate',
        text: 'Learn More',
        title: 'Learn how to automate the execution of your tests tools.'
      }
    }
  ],
  sidePitches: [
    {
      title: 'Avoid surprises',
      description: `Test your most complex workflows with real-world inputs to
      find the true impact of any code change.`
    },
    {
      title: 'Scale without worry',
      description: `Test your most complex workflows with real-world inputs to
      find the true impact of any code change.`
    },
    {
      title: 'Stay in the loop',
      description: `Test your most complex workflows with real-world inputs to
      find the true impact of any code change.`
    }
  ],
  testimonials: [
    {
      image: make_path('/images/weasel-customer-testimonial-vital-profile.jpg'),
      title: 'Pejman Ghorbanzade',
      subtitle: 'Sr. Software Engineer at Vital Images, Inc.',
      quote: `"We use Weasel at scale to perform nightly regression tests of
        some of our critical workflows with thousands of datasets. It has helped
        us quickly identify unintended side effects of our code changes before
        they become too expensive to fix. I like how easy it is to write new
        regression tests and automate their execution."`,
      learnMore: {
        title: `Learn more about how Vital Images uses Weasel`,
        text: "Read Vital Images' Story",
        link: 'https://docs.getweasel.com/stories/vital',
        hidden: false
      }
    }
  ]
};

export default function Home() {
  return (
    <>
      <Head>
        <title>Weasel</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
      </Head>
      <section className="bg-gradient-to-b from-dark-blue-900 to-dark-blue-700">
        <div className="wsl-min-h-screen-1 container mx-auto grid lg:grid-cols-2 lg:gap-4 lg:items-center">
          <div className="col-span-1 mx-auto pt-24 lg:pt-8 p-8 text-white space-y-8">
            <h2 className="wsl-text-gradient wsl-text-shadow max-w-xl text-4xl xl:text-5xl font-bold">
              Continuous regression testing for critical software workflows
            </h2>
            <p className="max-w-xl text-2xl">
              Test your most complex workflows with real-world inputs to find
              the true impact of any code change.
            </p>
            <div>
              <SignupForm></SignupForm>
            </div>
            <div>
              <a
                href="https://calendly.com/ghorbanzade/30min"
                target="_blank"
                rel="noopener noreferrer">
                <button
                  className="py-2 font-medium space-x-2 hover:underline focus:underline focus:outline-none group"
                  type="button"
                  role="button">
                  <span>Get a Live Demo</span>
                  <HiArrowNarrowRight className="inline h-4 opacity-50 group-hover:opacity-100"></HiArrowNarrowRight>
                </button>
              </a>
            </div>
            <div className="container mx-auto space-y-4">
              <p className="text-white uppercase">Trusted By</p>
              <div className="flex space-x-2">
                <a
                  href="https://vitalimages.com"
                  target="_blank"
                  rel="noopener noreferrer">
                  <img
                    className="text-gray-50"
                    src={make_path('/images/weasel-customer-logo-vital.svg')}
                    alt="Vital Images, Inc."
                  />
                </a>
              </div>
            </div>
          </div>
          <div className="col-span-1 max-w-screen-md h-full w-full mx-auto px-8 pb-8 lg:py-0 lg:px-4 select-none flex items-center">
            <img
              className="rounded-lg shadow-md"
              alt="A Screen Shot of Weasel Regression Testing Platform"
              src={make_path('/images/weasel-atf-visual.png')}
            />
          </div>
        </div>
      </section>
      <section className="bg-gradient-to-r from-dark-blue-900 via-dark-blue-800 to-dark-blue-800">
        <p className="p-8 mx-auto container text-center text-xl text-white font-semibold">
          We make maintaining software 10x more efficient.
        </p>
      </section>
      <section className="py-8 wsl-min-h-screen-1 bg-gradient-to-b from-dark-blue-800 to-dark-blue-900 grid">
        <div className="container mx-auto flex flex-col justify-between">
          <p className="px-8 py-32 max-w-3xl mx-auto text-3xl lg:text-4xl xl:text-5xl xl:leading-snug text-white font-light">
            Test your most complex workflows with real-world inputs to find the
            true impact of any code change.
          </p>
          <div className="px-8 grid xl:grid-cols-3 gap-8">
            <SidePitch input={content.sidePitches[0]}></SidePitch>
            <SidePitch input={content.sidePitches[1]}></SidePitch>
            <SidePitch input={content.sidePitches[2]}></SidePitch>
          </div>
        </div>
      </section>
      <section className="min-h-[75vh] bg-dark-blue-900 grid">
        <div className="wsl-landing-feature-child">
          <div className="wsl-landing-feature-nest">
            <Feature input={content.features[0]}></Feature>
          </div>
          <div className="lg:col-span-1 grid">
            <FeatureHero input={content.features[0]} />
          </div>
        </div>
      </section>
      <section className="min-h-[75vh] bg-dark-blue-900 grid">
        <div className="wsl-landing-feature-child">
          <div className="wsl-landing-feature-nest">
            <Feature input={content.features[1]}></Feature>
          </div>
          <div className="lg:col-span-1 grid">
            <FeatureHero input={content.features[1]} />
          </div>
        </div>
      </section>
      <section className="min-h-[75vh] bg-dark-blue-900 grid">
        <div className="wsl-landing-feature-child">
          <div className="wsl-landing-feature-nest">
            <Feature input={content.features[2]}></Feature>
          </div>
          <div className="lg:col-span-1 grid">
            <FeatureHero input={content.features[2]} />
          </div>
        </div>
      </section>
      <section className="min-h-[75vh] bg-dark-blue-900 grid">
        <div className="wsl-landing-feature-child">
          <div className="wsl-landing-feature-nest">
            <Feature input={content.features[3]}></Feature>
          </div>
          <div className="lg:col-span-1 grid">
            <FeatureHero input={content.features[3]} />
          </div>
        </div>
      </section>
      <section className="wsl-min-h-screen-1 bg-gradient-to-b from-dark-blue-900 via-dark-blue-900 to-dark-blue-800 grid">
        <div className="wsl-landing-feature-child">
          <div className="wsl-landing-feature-nest">
            <FaCity className="text-light-blue-600" size="3rem"></FaCity>
            <h3 className="text-4xl xl:text-5xl text-white font-bold">
              Built for the Enterprise
            </h3>
            <p className="text-2xl text-gray-300">
              Weasel started as an internal tool at a medical software company
              to find regressions in low-level components of a mission-critical
              product.
            </p>
          </div>
          <div className="wsl-landing-feature-nest">
            <Testimonial input={content.testimonials[0]}></Testimonial>
          </div>
        </div>
      </section>
      <section className="py-32 lg:pt-8 min-h-[25vh] flex items-center bg-dark-blue-800">
        <div className="container mx-auto px-8 md:px-24 lg:px-8">
          <FooterCta></FooterCta>
        </div>
      </section>
    </>
  );
}
