// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import { Metadata } from 'next';
import React from 'react';
import { IconType } from 'react-icons';
import {
  FaBookOpen,
  FaComments,
  FaDiscord,
  FaLink,
  FaTwitch,
  FaTwitter,
  FaYoutube
} from 'react-icons/fa';

import LocalTime from '@/components/launch/LocalTime';

type LaunchEventInput = {
  title: string;
  link?: string;
  description?: string[];
  date: number;
  icon: IconType;
  image?: string;
};
type PageInput = {
  date: number;
  title: string;
  events: LaunchEventInput[];
}[];

export const metadata: Metadata = {
  title: 'Launch Week',
  description:
    'A week-long series of blog posts, videos, webinars, and social conversations to mark the open-sourcing of Touca.',
  alternates: { canonical: '/launch' },
  openGraph: {
    title: 'Touca Launch Week: May 16, 2022',
    url: 'https://touca.io',
    images: [
      {
        url: 'https://touca.io/images/touca_banner_launch.png',
        width: 906,
        height: 453,
        alt: 'Touca Launch Week'
      }
    ]
  }
};

export default function Page() {
  const events: PageInput = [
    {
      date: Date.parse('2022-05-16T09:00:00.000-05:00'),
      title: 'Our Biggest Announcement Yet',
      events: [
        {
          title: 'Blog Post: Open Sourcing Touca',
          date: Date.parse('2022-05-16T09:00:00.000-05:00'),
          link: 'https://touca.io/blog/open-source-announcement/',
          icon: FaBookOpen,
          description: [
            'Today is the first day of a new chapter of Touca! We are open-sourcing our entire product. This change allows software engineers to self-host our technology and make changes to it as they see fit, without ever having to pay us.'
          ]
        },
        {
          title: 'Discord: What is Touca',
          date: Date.parse('2022-05-16T10:00:00.000-05:00'),
          link: 'https://discord.com/events/912032955956871188/974528012924108870',
          icon: FaDiscord,
          description: [
            'Join us on Matnbaz Discord Server as we introduce Touca to the open-source community and explain why we are fully open-sourcing our technology.'
          ]
        },
        {
          title: 'Webinar: Touca Open-Source Announcement',
          date: Date.parse('2022-05-16T11:00:00.000-05:00'),
          link: 'https://zoom.us/webinar/register/WN_o1KSs0KwTEejGs3ZLBNEJg',
          icon: FaYoutube,
          image: '/images/touca_event_webinar_220516.png',
          description: [
            'We are announcing full open-sourcing of Touca to enable every software engineer use our product for free to get real-time feedback when they write code that could break their software.',
            'Join Pejman Ghorbanzade to learn more about this change and other important changes to our business, from our pricing to product roadmap.'
          ]
        },
        {
          title: 'Twitter Spaces: Open Sourcing Touca',
          date: Date.parse('2022-05-16T12:00:00.000-05:00'),
          link: 'https://twitter.com/i/spaces/1ynJOZOjYMEGR',
          icon: FaTwitter,
          description: [
            "Let's chat about open-sourcing of Touca and other changes to our business model, how we made these decisions, and what we are trying to get from them."
          ]
        },
        {
          title: 'Clubhouse: Open Sourcing Touca (Farsi)',
          date: Date.parse('2022-05-16T13:00:00.000-05:00'),
          link: 'https://www.clubhouse.com/event/MRl4ol6A',
          icon: FaComments
        },
        {
          title: 'Twitch: Touca vs Snapshot Testing',
          date: Date.parse('2022-05-16T15:00:00.000-05:00'),
          link: 'https://www.twitch.tv/trytouca/schedule?seriesID=afd5ae15-fd54-4bd4-8547-8d4da4672b2c',
          icon: FaTwitch,
          image: '/images/touca_event_twitch_220516.png',
          description: [
            'Watch a hands-on demo of Touca and a review of its differences compared to snapshot testing tools.'
          ]
        }
      ]
    },
    {
      date: Date.parse('2022-05-17T09:00:00.000-05:00'),
      title: 'The Business Case: Customer Success Stories',
      events: [
        {
          title: 'Webinar: Conversation with Touca users',
          date: Date.parse('2022-05-17T11:00:00.000-05:00'),
          link: 'https://zoom.us/webinar/register/WN_gxbJlUU9ScW498PRH7bk7Q',
          icon: FaYoutube,
          image: '/images/touca_event_webinar_220517.png',
          description: [
            'Join us for a conversation with Zach Obermiller, software engineer at Canon Medical Informatics, as he shares about their software development process, what makes Canon a great place to work at, and how they use Touca to help with testing their flagship Vitrea Advanced Visualization software product.'
          ]
        },
        {
          title: 'Twitter Spaces: Touca Origin Story',
          date: Date.parse('2022-05-17T12:00:00.000-05:00'),
          icon: FaTwitter
        },
        {
          title: 'Clubhouse: Touca Origin Story (Farsi)',
          date: Date.parse('2022-05-17T13:00:00.000-05:00'),
          link: 'https://www.clubhouse.com/event/MRlVn87z',
          icon: FaComments
        },
        {
          title: 'Twitch: Continuous Regression Testing in Action',
          date: Date.parse('2022-05-17T15:00:00.000-05:00'),
          link: 'https://www.twitch.tv/trytouca/schedule?seriesID=a1a0ec57-95d5-473b-9301-2f753475e1b1',
          icon: FaTwitch,
          image: '/images/touca_event_twitch_220517.png'
        }
      ]
    },
    {
      date: Date.parse('2022-05-18T09:00:00.000-05:00'),
      title: 'Under The Hood: Engineering Deep Dive',
      events: [
        {
          title: 'Webinar: Touca Product Demo',
          date: Date.parse('2022-05-17T11:00:00.000-05:00'),
          link: 'https://zoom.us/webinar/register/WN_OKvLvnOlQV2kje3RdPI4Ew',
          icon: FaYoutube,
          image: '/images/touca_event_webinar_220518.png'
        },
        {
          title: 'Twitter Spaces: How Touca Works',
          date: Date.parse('2022-05-17T12:00:00.000-05:00'),
          icon: FaTwitter
        },
        {
          title: 'Clubhouse: How Touca Works (Farsi)',
          date: Date.parse('2022-05-17T13:00:00.000-05:00'),
          icon: FaComments
        },
        {
          title: 'Twitch: Touca Source Code Walk-Through',
          date: Date.parse('2022-05-17T15:00:00.000-05:00'),
          link: 'https://www.twitch.tv/trytouca/schedule?seriesID=ea955f29-979c-4f42-ad24-f37bf8adfd0c',
          icon: FaTwitch,
          image: '/images/touca_event_twitch_220518.png'
        }
      ]
    },
    {
      date: Date.parse('2022-05-19T09:00:00.000-05:00'),
      title: 'New Touca Features and Improvements',
      events: [
        {
          title: 'Webinar: Touca Product Updates and Roadmap',
          date: Date.parse('2022-05-19T10:00:00.000-05:00'),
          link: 'https://zoom.us/webinar/register/WN_40_ofqeMRh62nlQXz9vNHQ',
          icon: FaYoutube,
          image: '/images/touca_event_webinar_220519.png'
        },
        {
          title: 'Twitter Spaces: Mistakes were Made (Farsi)',
          date: Date.parse('2022-05-19T11:30:00.000-05:00'),
          icon: FaTwitter,
          description: [
            'Join us for a conversation with @Loc0m0, founder of an EdTech startup based in San Francisco, CA. ' +
              'We will reflect on our startup journey and share some of the lessons that we have learned the hard way.'
          ]
        },
        {
          title: 'Twitch: Extending Touca Python CLI',
          date: Date.parse('2022-05-19T15:00:00.000-05:00'),
          link: 'https://www.twitch.tv/trytouca/schedule?seriesID=e05706c3-c8a2-486d-9ff1-bf7bb36c2a0d',
          icon: FaTwitch,
          image: '/images/touca_event_twitch_220519.png'
        }
      ]
    },
    {
      date: Date.parse('2022-05-20T09:00:00.000-05:00'),
      title: 'Build With Us: Shaping the Future of Software Development',
      events: [
        {
          title: "Webinar: What's next for Touca?",
          date: Date.parse('2022-05-20T11:00:00.000-05:00'),
          link: 'https://zoom.us/webinar/register/WN_Ho-ncaLyQq2gnl_tDJxedQ',
          icon: FaYoutube,
          image: '/images/touca_event_webinar_220520.png'
        },
        {
          title: 'Discord: Good first issues for new contributors',
          date: Date.parse('2022-05-20T12:00:00.000-05:00'),
          link: 'https://discord.gg/PKCF6qMY?event=975546507522605096',
          icon: FaDiscord
        },
        {
          title: 'Twitch: Integrating Touca with your Development Workflow',
          date: Date.parse('2022-05-20T15:00:00.000-05:00'),
          link: 'https://www.twitch.tv/trytouca/schedule?seriesID=cb2ebdd8-6738-4dc2-8c92-9fa5061534d5',
          icon: FaTwitch,
          image: '/images/touca_event_twitch_220520.png'
        }
      ]
    }
  ];
  return (
    <section className="bg-dark-blue-900">
      <div className="wsl-min-h-screen-1 container mx-auto flex flex-col justify-center">
        <div className="space-y-2 p-4 text-center">
          <h2 className="text-5xl font-extrabold text-white">
            Touca Launch Week
          </h2>
          <p className="text-3xl text-white">A bold new start</p>
        </div>
      </div>
      {events.map((day, index) => {
        return (
          <div
            key={index}
            className="container mx-auto flex flex-col justify-center py-36">
            <div className="space-y-2 p-4 text-center">
              <div className="space-y-4 p-8 lg:p-16">
                <h3 className="text-3xl font-extrabold text-white lg:text-5xl">
                  {new Intl.DateTimeFormat('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    timeZone: 'America/Chicago'
                  }).format(day.date)}
                </h3>
                <p className="text-2xl text-white">{day.title}</p>
              </div>
              <ul className="space-y-6 text-xl text-gray-300">
                {day.events.map((event, index) => {
                  return (
                    <li key={index} className="flex justify-center">
                      <LaunchEvent input={event}></LaunchEvent>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        );
      })}
    </section>
  );
}

const LaunchEvent = (props: { input: LaunchEventInput }) => {
  const Icon = props.input.icon;
  const rounded = props.input.image ? 'rounded-b-lg' : 'rounded-lg';
  return (
    <div className="min-h-[4rem] rounded-lg lg:min-w-[50%] lg:max-w-[50%]">
      {props.input.image && (
        <div className="flex">
          <img
            className="w-full rounded-t-lg"
            src={props.input.image}
            alt="Touca Launch Week Banner"
          />
        </div>
      )}
      <div
        className={`space-y-4 bg-opacity-50 bg-gradient-to-br from-dark-blue-800 to-dark-blue-900 p-4 ${rounded}`}>
        <div className="flex">
          <div className="rounded-full p-2 text-3xl text-gray-500 hover:text-white">
            <Icon />
          </div>
          <div className="flex-grow p-2 text-left font-medium">
            {props.input.title}
          </div>
          <div className="p-2">
            <div className="text-base">
              <LocalTime date={props.input.date} />
            </div>
          </div>
        </div>
        {props.input.description && (
          <div className="space-y-2 px-2 text-left">
            {props.input.description.map((paragraph, index) => (
              <p className="text-base" key={index}>
                {paragraph}
              </p>
            ))}
          </div>
        )}
        {props.input.link && (
          <div className="flex justify-end">
            <a
              href={props.input.link}
              target="_blank"
              rel="noreferrer noopener">
              <div className="flex space-x-2 rounded-full bg-sky-900 bg-opacity-25 px-4 py-2 hover:opacity-100">
                <FaLink />
                <span className="text-sm font-semibold">Join</span>
              </div>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
