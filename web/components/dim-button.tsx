// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import { HiArrowNarrowRight } from 'react-icons/hi';

export const DimButton = (props: Record<'link' | 'text' | 'title', string>) => {
  return (
    <a
      href={props.link}
      title={props.title}
      target="_blank"
      rel="noopener noreferrer">
      <button
        className="group space-x-1 whitespace-nowrap rounded-xl bg-dark-blue-700 bg-opacity-25 p-4 text-gray-300 hover:text-white focus:underline focus:outline-none"
        type="button"
        role="button">
        <span className="text-md font-medium leading-6">{props.text}</span>
        <HiArrowNarrowRight className="inline h-6 opacity-50 group-hover:opacity-100"></HiArrowNarrowRight>
      </button>
    </a>
  );
};
