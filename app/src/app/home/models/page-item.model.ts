/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

export enum IconColor {
  Blue = 'dodgerblue',
  Gold = 'gold',
  Gray = 'lightgray',
  Green = 'mediumseagreen',
  Orange = 'darkorange',
  Red = 'mediumvioletred'
}

export enum IconType {
  PlusCircle = 'plus-circle',
  MinusCircle = 'minus-circle',
  Spinner = 'spinner',
  CheckCircle = 'check-circle',
  Circle = 'circle',
  Star = 'star',
  TimesCircle = 'times-circle'
}

export type Icon = {
  color: IconColor;
  type: IconType;
  spin: boolean;
};

export type Data = {
  link: string;
  name: string;
  query: any;
};

export type Topic = {
  text: string;
  title?: string;
};
