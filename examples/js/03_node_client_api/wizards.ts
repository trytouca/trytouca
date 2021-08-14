/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

export interface Wizard {
  username: string;
  fullname: string;
  dob: Record<'year' | 'month' | 'day', number>;
  height: number;
  weight: number;
  wands: string[];
}

const wizards: Wizard[] = [
  {
    username: 'rweasley',
    fullname: 'Ronald Weasley',
    dob: { year: 1980, month: 3, day: 1 },
    height: 6.3,
    weight: 152.0,
    wands: ['unicorn tail hair']
  },
  {
    username: 'hpotter',
    fullname: 'Harry Potter',
    dob: { year: 1980, month: 6, day: 31 },
    height: 6.0,
    weight: 145.0,
    wands: ['phoenix feather']
  },
  {
    username: 'hgranger',
    fullname: 'Hermione Jean Granger',
    dob: { year: 1979, month: 9, day: 19 },
    height: 5.5,
    weight: 120.0,
    wands: ['dragon heartstring']
  }
];

export function parse_profile(username: string): Wizard | undefined {
  return wizards.find((item) => item.username === username);
}
