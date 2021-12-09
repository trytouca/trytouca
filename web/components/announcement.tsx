// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

export type AnnouncementInput = {
  action: string;
  hidden: boolean;
  link: string;
  text: string;
  elevator: string;
};

export default function Announcement(props: { input: AnnouncementInput }) {
  return (
    <section className="bg-gradient-to-r from-dark-blue-900 via-dark-blue-800 to-dark-blue-800">
      {(props.input.hidden && (
        <p className="container p-8 mx-auto text-xl font-semibold text-center text-white">
          {props.input.elevator}
        </p>
      )) || (
        <p className="container p-8 mx-auto space-x-2 text-lg font-medium text-center text-white">
          <span>{props.input.text}</span>
          <a
            className="font-bold underline hover:text-gray-200 "
            href={props.input.link}>
            {props.input.action}
          </a>
        </p>
      )}
    </section>
  );
}
