// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import Link from 'next/link';

type AnnouncementInput = {
  action: string;
  hidden: boolean;
  link: string;
  text: string;
  elevator: string;
};

const input: AnnouncementInput = {
  action: 'Read our blog post',
  hidden: false,
  link: 'https://touca.io/github',
  text: 'Touca has shutdown as a company. The open-source project lives on.',
  elevator:
    "Fixing silly mistakes shouldn't need a round-trip with your QA team."
};

export default function Announcement() {
  return (
    <section className="bg-dark-blue-900">
      {(input.hidden && (
        <p className="container mx-auto p-8 text-center text-xl font-semibold text-white">
          {input.elevator}
        </p>
      )) || (
        <p className="container mx-auto space-x-2 p-8 text-center text-xl font-medium text-white">
          <span>{input.text}</span>
          <a className="underline hover:text-gray-200 " href={input.link}>
            {input.action}
          </a>
        </p>
      )}
    </section>
  );
}

export function BreakingNews({
  input
}: {
  input: { text: string; link?: string };
}) {
  return (
    input && (
      <div className="bg-[#6CB7DF] py-2">
        <div className="container mx-auto text-center font-medium">
          {input.text}{' '}
          {input.link && (
            <Link href={input.link} className="text-sky-800 underline">
              Learn more
            </Link>
          )}
        </div>
      </div>
    )
  );
}
