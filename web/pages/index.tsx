/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
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
  image: {
    link: string;
    alt: string;
  };
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
  pitch: {
    title: string;
    subtitle: string;
    elevator: string;
    banner: string;
    sides: SidePitchInput[];
  };
  features: FeatureInput[];
  testimonials: TestimonialInput[];
};

const DimButton = (props: Record<'link' | 'text' | 'title', string>) => {
  return (
    <a
      href={props.link}
      title={props.title}
      target="_blank"
      rel="noopener noreferrer">
      <button
        className="px-4 py-2 bg-dark-blue-700 bg-opacity-25 text-gray-300 hover:text-white rounded-full space-x-1 focus:underline focus:outline-none group"
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
          <p className="text-2xl lg:text-3xl text-white font-semibold">
            {props.input.title}
          </p>
        </div>
        <p className="pl-10 text-xl lg:text-2xl text-gray-200">
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
          src={props.input.image.link}
          alt={props.input.image.alt}
          loading="lazy"
        />
      </div>
    </div>
  );
};

const Testimonial = (props: { input: TestimonialInput }) => {
  return (
    <div className="bg-dark-blue-800 bg-opacity-75 p-8 rounded-lg shadow-xl space-y-4">
      <figcaption className="flex items-center space-x-4">
        <img
          className="w-20 h-20 rounded-2xl"
          src={props.input.image}
          alt={`${props.input.title}, ${props.input.subtitle}`}
          loading="lazy"
        />
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
  pitch: {
    title: 'Continuous regression testing for critical software workflows',
    subtitle: `Test your most complex workflows with real-world inputs to find
      the true impact of any code change.`,
    elevator: 'We make maintaining software 10x more efficient.',
    banner: `Test your most complex workflows with real-world inputs to find
      the true impact of any code change.`,
    sides: [
      {
        title: 'Avoid surprises',
        description: `Detect potentially unintended side effects of any code
          change, during your development cycle.`
      },
      {
        title: 'Scale without worry',
        description: `Test your workflows with any number of inputs, without
          generating and managing snapshot files.`
      },
      {
        title: 'Stay in the loop',
        description: `Maintain an accurate understanding of how your product
          behaves, across your team.`
      }
    ]
  },
  features: [
    {
      icon: HiOutlineUpload,
      image: {
        link: make_path('/images/touca_landing_feature_1.png'),
        alt: 'Submit regression test results with Touca client libraries.'
      },
      title: 'Submit',
      description: `Use our client libraries to capture values of important
        variables and runtime of functions, for any number of test cases,
        from anywhere within your code.`,
      button: {
        link: 'https://docs.touca.io/guides/submit',
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
      title: 'Interpret',
      description: `Touca compares your results against your baseline version
        and reports changes in behavior and performance of your software.`,
      button: {
        link: 'https://docs.touca.io/guides/interpret',
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
      title: 'Collaborate',
      description: `Work as a team to resolve or justify new differences.
        Maintain a shared understanding of how your software is supposed
        to work.`,
      button: {
        link: 'https://docs.touca.io/guides/collaborate',
        text: 'Learn More',
        title: 'Learn how to work as a team to deal with regressions.'
      }
    },
    {
      icon: HiOutlineCog,
      image: {
        link: make_path('/images/touca_landing_feature_4.png'),
        alt: 'Automate your regression tests using Touca test frameworks.'
      },
      title: 'Automate',
      description: `Make your tests run continuously on a fixed schedule
        or as you introduce new code changes.`,
      button: {
        link: 'https://docs.touca.io/guides/automate',
        text: 'Learn More',
        title: 'Learn how to automate the execution of your tests tools.'
      }
    }
  ],
  testimonials: [
    {
      image: make_path('/images/touca-customer-testimonial-vital-profile.jpg'),
      title: 'Pejman Ghorbanzade',
      subtitle: 'Sr. Software Engineer at Vital Images, Inc.',
      quote: `"We use Touca at scale to perform nightly regression tests of
        some of our critical workflows with thousands of datasets. It has helped
        us quickly identify unintended side effects of our code changes before
        they become too expensive to fix. I like how easy it is to write new
        regression tests and automate their execution."`,
      learnMore: {
        title: `Learn more about how Vital Images uses Touca`,
        text: "Read Vital Images' Story",
        link: 'https://docs.touca.io/stories/vital',
        hidden: false
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
        <div className="wsl-min-h-screen-1 container mx-auto grid lg:grid-cols-2 lg:gap-4 lg:items-center">
          <div className="col-span-1 mx-auto pt-24 lg:pt-8 p-8 text-white space-y-8">
            <h2 className="wsl-text-gradient wsl-text-shadow max-w-xl text-4xl xl:text-5xl font-bold">
              {content.pitch.title}
            </h2>
            <p className="max-w-xl text-2xl">{content.pitch.subtitle}</p>
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
                    src={make_path('/images/touca-customer-logo-vital.svg')}
                    alt="Vital Images, Inc."
                    loading="eager"
                  />
                </a>
              </div>
            </div>
          </div>
          <div className="col-span-1 max-w-screen-md h-full w-full mx-auto px-8 pb-8 lg:py-0 lg:px-4 select-none flex items-center">
            <img
              className="rounded-lg shadow-md"
              alt="A Screen Shot of Touca Regression Testing Platform"
              src={make_path('/images/touca-atf-visual.png')}
              loading="eager"
            />
          </div>
        </div>
      </section>
      <section className="bg-gradient-to-r from-dark-blue-900 via-dark-blue-800 to-dark-blue-800">
        <p className="p-8 mx-auto container text-center text-xl text-white font-semibold">
          {content.pitch.elevator}
        </p>
      </section>
      <section className="py-8 wsl-min-h-screen-1 bg-gradient-to-b from-dark-blue-800 to-dark-blue-900 grid">
        <div className="container mx-auto flex flex-col justify-between">
          <p className="px-8 py-32 max-w-3xl mx-auto text-3xl lg:text-4xl xl:text-5xl xl:leading-snug text-white font-light">
            {content.pitch.banner}
          </p>
          <div className="px-8 grid xl:grid-cols-3 gap-8">
            <SidePitch input={content.pitch.sides[0]}></SidePitch>
            <SidePitch input={content.pitch.sides[1]}></SidePitch>
            <SidePitch input={content.pitch.sides[2]}></SidePitch>
          </div>
        </div>
      </section>
      {content.features.map((feature, index) => (
        <section
          key={index}
          className="wsl-min-h-screen-1 bg-dark-blue-900 grid">
          <div className="wsl-landing-feature-child">
            <div className="wsl-landing-feature-nest">
              <Feature input={feature}></Feature>
            </div>
            <div className="lg:col-span-1 grid">
              <FeatureHero input={feature} />
            </div>
          </div>
        </section>
      ))}
      <section className="wsl-min-h-screen-1 bg-gradient-to-b from-dark-blue-900 via-dark-blue-900 to-dark-blue-800 grid">
        <div className="wsl-landing-feature-child">
          <div className="wsl-landing-feature-nest">
            <FaCity className="text-light-blue-600" size="3rem"></FaCity>
            <h3 className="text-4xl xl:text-5xl text-white font-bold">
              Built for the Enterprise
            </h3>
            <p className="text-2xl text-gray-300">
              Touca started as an internal tool at a medical software company to
              find regressions in low-level components of a mission-critical
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
