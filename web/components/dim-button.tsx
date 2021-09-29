// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { HiArrowNarrowRight } from 'react-icons/hi';

export const DimButton = (props: Record<'link' | 'text' | 'title', string>) => {
  return (
    <a
      href={props.link}
      title={props.title}
      target="_blank"
      rel="noopener noreferrer">
      <button
        className="px-4 py-2 space-x-1 text-gray-300 bg-opacity-25 rounded-full bg-dark-blue-700 hover:text-white focus:underline focus:outline-none group"
        type="button"
        role="button">
        <span className="text-sm font-medium leading-6">{props.text}</span>
        <HiArrowNarrowRight className="inline h-6 opacity-50 group-hover:opacity-100"></HiArrowNarrowRight>
      </button>
    </a>
  );
};
