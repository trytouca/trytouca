// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

interface Course {
  name: string;
  grade: number;
}

class Student {
  constructor(
    public readonly username: string,
    public readonly fullname: string,
    public readonly dob: Date,
    public readonly courses: { name: string; grade: number }[]
  ) {}
}

/**
 *
 */
export function parse_profile(username: string): Student {
  return new Map<string, Student>([
    [
      'alice',
      new Student('alice', 'Alice Anderson', new Date(2006, 3, 1), [
        { name: 'math', grade: 4.0 },
        { name: 'computers', grade: 3.8 }
      ])
    ],
    [
      'bob',
      new Student('bob', 'Bob Brown', new Date(1996, 6, 31), [
        { name: 'english', grade: 3.7 },
        { name: 'history', grade: 3.9 }
      ])
    ],
    [
      'charlie',
      new Student('charlie', 'Charlie Clark', new Date(2003, 9, 19), [
        { name: 'math', grade: 2.9 },
        { name: 'computers', grade: 3.7 }
      ])
    ]
  ]).get(username) as Student;
}

/**
 *
 */
export function calculate_gpa(courses: Course[]): number {
  return courses.reduce((sum, v) => sum + v.grade, 0) / courses.length;
}
