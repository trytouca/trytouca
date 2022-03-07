// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import {
  LogoJsonLd,
  NextSeo,
  OrganizationJsonLd,
  SocialProfileJsonLd
} from 'next-seo';
import { HiOutlineLightBulb, HiOutlineUserGroup } from 'react-icons/hi';

import Announcement, { AnnouncementInput } from '@/components/announcement';
import AboveTheFold from '@/components/atf';
import FeatureAutomate from '@/components/feature-automate';
import FeatureCollaborate from '@/components/feature-collaborate';
import FeatureCompare from '@/components/feature-compare';
import FeatureSubmit from '@/components/feature-submit';
import FeatureTestimonials, {
  TestimonialInput
} from '@/components/feature-testimonials';
import Header from '@/components/header';
import OneLinerPitch from '@/components/pitch';
import { make_path } from '@/lib/api';
import { FeatureInput } from '@/lib/feature';

type PageContent = {
  announcement: AnnouncementInput;
  features: FeatureInput[];
  testimonials: TestimonialInput[];
};

const content: PageContent = {
  announcement: {
    action: '',
    hidden: true,
    link: '',
    text: '',
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
        link: 'https://touca.io/docs/basics/quickstart',
        text: 'Learn More',
        title: ''
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
        link: 'https://touca.io/docs/basics/interpret',
        text: 'Read about our insights engine',
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
      description: `Receive notifications when differences are found. Work
        together to resolve or justify them. Maintain a shared understanding
        of how your software works and is supposed to work.`,
      button: {
        link: 'https://touca.io/docs/basics/integrate',
        text: 'Read about our integrations',
        title: 'Learn how to work as a team to deal with regressions.'
      }
    },
    {
      title: 'Continuously run Touca tests at any scale',
      description: `Automate the execution of your tests, locally or as part of
        your build pipeline, or on a dedicated test server; however you like,
        whenever you like. We give you real-time feedback, when you need it.`,
      button: {
        link: 'https://touca.io/docs/basics/automate',
        text: 'Read about our automation features',
        title: 'Learn how to automate the execution of your tests tools.'
      }
    }
  ],
  testimonials: [
    {
      image: make_path('/images/touca-customer-testimonial-vital-profile.jpg'),
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
      <Header></Header>
      <AboveTheFold></AboveTheFold>
      <Announcement input={content.announcement}></Announcement>
      <OneLinerPitch></OneLinerPitch>
      <FeatureTestimonials input={content.testimonials}></FeatureTestimonials>
      <FeatureSubmit input={content.features[0]}></FeatureSubmit>
      <FeatureCompare input={content.features[1]}></FeatureCompare>
      <FeatureCollaborate input={content.features[2]}></FeatureCollaborate>
      <FeatureAutomate input={content.features[3]}></FeatureAutomate>
    </>
  );
}
