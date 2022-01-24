// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { IconType } from 'react-icons';

export type FeatureInput = {
  icon?: IconType;
  image?: {
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

export const FeatureHero = (props: { input: FeatureInput }) => {
  return (
    <div className="flex items-center justify-center">
      <div className="w-full rounded-xl bg-gradient-to-b from-dark-blue-800 to-dark-blue-900 md:p-4 xl:p-6">
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
