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
