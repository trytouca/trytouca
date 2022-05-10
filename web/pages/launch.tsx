// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { BreadcrumbJsonLd, NextSeo } from 'next-seo';
import React from 'react';
import {
  FaBookOpen,
  FaComments,
  FaTwitch,
  FaTwitter,
  FaYoutube
} from 'react-icons/fa';

import Header from '@/components/header';

export default function LaunchPage() {
  const events = [
    {
      date: Date.parse('2022-05-16T09:00:00.000-05:00'),
      title: 'Our Biggest Announcement Yet',
      events: [
        {
          title: 'Product Hunt: Touca Open Source',
          date: Date.parse('2022-05-16T09:00:00.000-05:00'),
          icon: FaBookOpen
        },
        {
          title: 'Webinar: Announcement and Product Demo',
          date: Date.parse('2022-05-16T11:00:00.000-05:00'),
          icon: FaYoutube
        },
        {
          title: 'Twitter Spaces: Open Sourcing Touca',
          date: Date.parse('2022-05-16T12:00:00.000-05:00'),
          icon: FaTwitter
        },
        {
          title: 'Clubhouse: Open Sourcing Touca (Farsi)',
          date: Date.parse('2022-05-16T13:30:00.000-05:00'),
          icon: FaComments
        },
        {
          title: 'Live Coding: Touca vs Snapshot Testing',
          date: Date.parse('2022-05-16T15:00:00.000-05:00'),
          icon: FaTwitch
        }
      ]
    },
    {
      date: Date.parse('2022-05-17T09:00:00.000-05:00'),
      title: 'The Business Case: Customer Success Stories',
      events: [
        {
          title: 'Blog Post: How Canon Uses Touca',
          date: Date.parse('2022-05-17T09:00:00.000-05:00'),
          icon: FaBookOpen
        },
        {
          title: 'Webinar: Conversation with Touca users',
          date: Date.parse('2022-05-17T11:00:00.000-05:00'),
          icon: FaYoutube
        },
        {
          title: 'Twitter Spaces: Touca Origin Story',
          date: Date.parse('2022-05-17T12:00:00.000-05:00'),
          icon: FaTwitter
        },
        {
          title: 'Clubhouse: Touca Origin Story (Farsi)',
          date: Date.parse('2022-05-17T13:30:00.000-05:00'),
          icon: FaComments
        },
        {
          title: 'Live Coding: Continuous Regression Testing in Action',
          date: Date.parse('2022-05-17T15:00:00.000-05:00'),
          icon: FaTwitch
        }
      ]
    },
    {
      date: Date.parse('2022-05-18T09:00:00.000-05:00'),
      title: 'Under The Hood: Engineering Deep Dive',
      events: [
        {
          title: 'Blog Post: Touca Software Architecture',
          date: Date.parse('2022-05-17T09:00:00.000-05:00'),
          icon: FaBookOpen
        },
        {
          title: 'Webinar: Touca Product Demo',
          date: Date.parse('2022-05-17T11:00:00.000-05:00'),
          icon: FaYoutube
        },
        {
          title: 'Twitter Spaces: How Touca Works',
          date: Date.parse('2022-05-17T12:00:00.000-05:00'),
          icon: FaTwitter
        },
        {
          title: 'Clubhouse: AMA with Pejman Ghorbanzade (Farsi)',
          date: Date.parse('2022-05-17T13:30:00.000-05:00'),
          icon: FaComments
        },
        {
          title: 'Live Coding: Touca Source Code Walk-Through',
          date: Date.parse('2022-05-17T15:00:00.000-05:00'),
          icon: FaTwitch
        }
      ]
    },
    {
      date: Date.parse('2022-05-19T09:00:00.000-05:00'),
      title: 'Mistakes were Made: Reflecting on our Startup Journey',
      events: [
        {
          title: 'Blog Post: Building with Empathy',
          date: Date.parse('2022-05-19T09:00:00.000-05:00'),
          icon: FaBookOpen
        },
        {
          title: 'Webinar: Mistakes were Made',
          date: Date.parse('2022-05-19T11:00:00.000-05:00'),
          icon: FaYoutube
        },
        {
          title: 'Twitter Spaces: Mistakes were Made (Farsi)',
          date: Date.parse('2022-05-19T12:00:00.000-05:00'),
          icon: FaTwitter
        },
        {
          title: 'Live Coding: Extending Touca Python CLI',
          date: Date.parse('2022-05-19T15:00:00.000-05:00'),
          icon: FaTwitch
        }
      ]
    },
    {
      date: Date.parse('2022-05-20T09:00:00.000-05:00'),
      title: 'Build With Us: Shaping the Future of Software Development',
      events: [
        {
          title: 'Blog Post: Touca Open-Source Contributors Program',
          date: Date.parse('2022-05-20T09:00:00.000-05:00'),
          icon: FaBookOpen
        },
        {
          title: 'Twitter Spaces: AMA with Pejman Ghorbanzade',
          date: Date.parse('2022-05-20T12:00:00.000-05:00'),
          icon: FaTwitter
        },
        {
          title: 'Integrating Touca with your development workflow',
          date: Date.parse('2022-05-20T15:00:00.000-05:00'),
          icon: FaTwitch
        }
      ]
    }
  ];
  return (
    <>
      <BreadcrumbJsonLd
        itemListElements={[{ position: 1, name: 'Touca Launch Week' }]}
      />
      <NextSeo
        title="Touca Launch Week"
        canonical="https://touca.io/launch"
        openGraph={{
          type: 'website',
          locale: 'en_US',
          site_name: 'Touca',
          url: 'https://touca.io/',
          title: 'Touca Launch Week',
          description: 'A week-long ',
          images: [
            {
              url: 'https://touca.io/images/touca_banner_launch.png',
              width: 906,
              height: 453,
              alt: 'Touca Launch Week',
              type: 'image/png'
            }
          ]
        }}
      />
      <Header></Header>
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
              className="wsl-min-h-screen-3 container mx-auto flex flex-col justify-center">
              <div className="space-y-2 p-4 text-center">
                <div className="space-y-4 p-16">
                  <h3 className="text-5xl font-extrabold text-white">
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
                    const Icon = event.icon;
                    return (
                      <li key={index} className="flex justify-center">
                        <div className="flex min-h-[4rem] min-w-[50%] rounded-lg bg-opacity-50 bg-gradient-to-br from-dark-blue-800 to-dark-blue-900 p-4">
                          <div className="rounded-full p-2 text-3xl text-gray-500 hover:text-white">
                            <Icon></Icon>
                          </div>
                          <div className="flex-grow p-2 text-left font-medium">
                            {event.title}
                          </div>
                          <div className=" p-2">
                            <div className="text-base">
                              {new Intl.DateTimeFormat('en-US', {
                                hour: 'numeric',
                                minute: 'numeric',
                                timeZone: 'America/Chicago',
                                timeZoneName: 'short'
                              }).format(event.date)}
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}
