// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import Link from 'next/link';

export type AnnouncementInput = {
  action: string;
  hidden: boolean;
  link: string;
  text: string;
  elevator: string;
};

export function Announcement(props: { input: AnnouncementInput }) {
  return (
    <section className="bg-dark-blue-900">
      {(props.input.hidden && (
        <p className="container mx-auto p-8 text-center text-xl font-semibold text-white">
          {props.input.elevator}
        </p>
      )) || (
        <p className="container mx-auto space-x-2 p-8 text-center text-xl font-medium text-white">
          <span>{props.input.text}</span>
          <a className="underline hover:text-gray-200 " href={props.input.link}>
            {props.input.action}
          </a>
        </p>
      )}
    </section>
  );
}

export function BreakingNews(props: {
  input: { text: string; link?: string };
}) {
  return props.input && (
    <div className="bg-[#6CB7DF] py-2">
      <div className="mx-auto container text-center font-medium">
        {props.input.text}{' '}
        {props.input.link && (
          <Link href={props.input.link} className="underline text-sky-800">
            Learn more
          </Link>
        )}
      </div>
    </div>
  );
}
