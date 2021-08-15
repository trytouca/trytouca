// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

export interface Student {
  username: string;
  fullname: string;
  dob: Record<'year' | 'month' | 'day', number>;
  height: number;
  weight: number;
  courses: {name: string, grade: number}[]
}

const students: Student[] = [
  {
    username: 'alice',
    fullname: 'Alice Anderson',
    dob: { year: 1980, month: 3, day: 1 },
    height: 6.3,
    weight: 152,
    courses: [{name: 'math', grade: 4.0}]
  },
  {
    username: 'bob',
    fullname: 'Bob Brown',
    dob: { year: 1980, month: 6, day: 31 },
    height: 6.0,
    weight: 145,
    courses: [{name: 'english', grade: 3.7}, {name: 'history', grade: 3.9}]
  },
  {
    username: 'charlie',
    fullname: 'Charlie Clark',
    dob: { year: 1979, month: 9, day: 19 },
    height: 5.5,
    weight: 120,
    courses: [{name: 'math', grade: 2.9}, {name: 'computers', grade:3.7}]
  }
];

export function parse_profile(username: string): Student | undefined {
  return students.find((item) => item.username === username);
}
