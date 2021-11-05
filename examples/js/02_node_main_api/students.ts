// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { touca } from '@touca/node';

interface Course {
  name: string;
  grade: number;
}

interface Student {
  username: string;
  fullname: string;
  dob: Date;
  gpa: number;
}

const students = [
  {
    username: 'alice',
    fullname: 'Alice Anderson',
    dob: new Date(2006, 3, 1),
    courses: [
      { name: 'math', grade: 4.0 },
      { name: 'computers', grade: 3.8 }
    ]
  },
  {
    username: 'bob',
    fullname: 'Bob Brown',
    dob: new Date(1996, 6, 30),
    courses: [
      { name: 'english', grade: 3.7 },
      { name: 'history', grade: 3.9 }
    ]
  },
  {
    username: 'charlie',
    fullname: 'Charlie Clark',
    dob: new Date(2003, 9, 19),
    courses: [
      { name: 'math', grade: 2.9 },
      { name: 'computers', grade: 3.7 }
    ]
  }
];

function calculate_gpa(courses: Course[]): number {
  touca.add_result('courses', courses);
  return courses.length
    ? courses.reduce((sum, v) => sum + v.grade, 0) / courses.length
    : 0.0;
}

export async function find_student(username: string): Promise<Student> {
  await new Promise((v) => setTimeout(v, 100));
  const data = students.find((v) => v.username === username);
  if (!data) {
    throw new Error(`no student found for username: ${username}`);
  }
  const { courses, ...student } = data;
  return { ...student, gpa: calculate_gpa(courses) };
}
