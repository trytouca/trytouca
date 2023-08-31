// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import {
  LogoJsonLd,
  NextSeo,
  OrganizationJsonLd,
  SocialProfileJsonLd
} from 'next-seo';
import { FiCode, FiRepeat } from 'react-icons/fi';
import { HiOutlineLightBulb, HiOutlineUserGroup } from 'react-icons/hi';

import { Announcement, AnnouncementInput } from '@/components/announcement';
import { AboveTheFold, ATFScreenshot } from '@/components/atf';
import FeatureAutomate from '@/components/feature-automate';
import FeatureCollaborate from '@/components/feature-collaborate';
import FeatureAnalytics from '@/components/feature-compare';
import FeatureDiff from '@/components/feature-diff';
import FeatureSubmit from '@/components/feature-submit';
import FeatureTestimonials, {
  TestimonialInput
} from '@/components/feature-testimonials';
import Header from '@/components/header';
import OneLinerPitch from '@/components/pitch';
import { FeatureInput } from '@/lib/feature';

type PageContent = {
  announcement: AnnouncementInput;
  features: FeatureInput[];
  testimonials: TestimonialInput[];
};

const content: PageContent = {
  announcement: {
    action: 'Read our blog post',
    hidden: false,
    link: 'https://touca.io/github',
    text: 'Touca has shutdown as a company. The open-source project lives on.',
    elevator:
      "Fixing silly mistakes shouldn't need a round-trip with your QA team."
  },
  features: [
    {
      icon: FiCode,
      title: 'Write regression tests, the easy way',
      description: `Test your complex software workflows for any number of inputs by capturing values of variables and runtime of functions.`,
      button: {
        link: 'https://touca.io/docs/sdk/main-api',
        text: 'Learn More',
        title: ''
      }
    },
    {
      icon: FiRepeat,
      title: 'Run your tests, continuously',
      description: `Run your tests for each code change or pull request, as part of CI or on a dedicated test machine, to get fast feedback during the development stage.`,
      button: {
        link: 'https://touca.io/docs/basics/automate',
        text: 'CLI, Github Action plugins, Self-hosted test runners...',
        title: 'Learn how to automate the execution of your tests tools.'
      }
    },
    {
      icon: HiOutlineLightBulb,
      title: 'Gain insights from your test results',
      description: `Learn how behavior and performance of your software evolves over time. Get notified about regressions in software workflows you care about.`,
      button: {
        link: 'https://touca.io/docs/basics/',
        text: 'Gain confidence in your releases',
        title: 'Learn how Touca processes your results and reports regressions.'
      }
    },
    {
      icon: HiOutlineUserGroup,
      title: 'Collaborate with your team',
      description: `Share test results with your team members, visualize differences, collaborate in investigating potential regressions, and manage baseline versions.`,
      button: {
        link: 'https://touca.io/docs/basics/interpret/',
        text: 'Keep your stakeholders in the loop',
        title: 'Learn how to work as a team to deal with regressions.'
      }
    }
  ],
  testimonials: [
    {
      image: '/images/touca-customer-testimonial-vital-profile.jpg',
      name: 'Ben Jackson',
      role: 'Principal Software Engineer',
      company: 'Canon Medical Informatics',
      quote: [
        `"We use Touca to perform nightly regression tests of our critical
        workflows. When we make changes to complex software, we need to have
        confidence that there have been no unexpected consequences. Touca gives
        us that confidence by tracking millions of output values computed from
        thousands of input datasets and helping us understand exactly how those
        outputs have changed from one build to the next. That confidence gives
        us leverage to develop new features faster and with fewer problems."`
      ],
      learnMore: {
        title: `Learn how Canon Medical Informatics uses Touca`,
        text: "Read Canon Medical's Story",
        link: 'https://touca.io/docs/stories/vital',
        hidden: true
      }
    }
  ]
};

export default function Home() {
  return (
    <>
      <NextSeo canonical="https://touca.io/" />
      <LogoJsonLd
        logo="https://touca.io/icons/icon-192x192.png"
        url="https://touca.io"
      />
      <OrganizationJsonLd
        type="Corporation"
        legalName="Touca, Inc."
        name="Touca"
        logo="https://touca.io/icons/icon-192x192.png"
        address={{
          streetAddress: '548 Market Street PMB 93767',
          addressLocality: 'San Francisco',
          addressRegion: 'CA',
          postalCode: '94104',
          addressCountry: 'US'
        }}
        url="https://touca.io/"
      />
      <SocialProfileJsonLd
        type="Organization"
        name="Touca.io"
        url="https://touca.io"
        sameAs={[
          'https://youtube.com/channel/UCAGugoQDJY3wdMuqETTOvIA',
          'https://twitter.com/trytouca',
          'https://linkedin.com/company/touca'
        ]}
      />
      <Header />
      <AboveTheFold />
      <ATFScreenshot />
      <Announcement input={content.announcement} />
      <OneLinerPitch />
      <FeatureTestimonials input={content.testimonials} />
      <FeatureDiff />
      <FeatureSubmit input={content.features[0]} />
      <FeatureAutomate input={content.features[1]} />
      <FeatureAnalytics input={content.features[2]} />
      <FeatureCollaborate input={content.features[3]} />
    </>
  );
}
