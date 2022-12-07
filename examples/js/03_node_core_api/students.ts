// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

export class Course {
  constructor(public readonly name: string, public readonly grade: number) {}
}

interface Student {
  username: string;
  fullname: string;
  dob: Date;
  courses: Course[];
}

const students: Student[] = [
  {
    username: 'alice',
    fullname: 'Alice Anderson',
    dob: new Date(2006, 3, 1),
    courses: [new Course('math', 4.0), new Course('computers', 3.8)]
  },
  {
    username: 'bob',
    fullname: 'Bob Brown',
    dob: new Date(1996, 6, 31),
    courses: [new Course('english', 3.7), new Course('history', 3.9)]
  },
  {
    username: 'charlie',
    fullname: 'Charlie Clark',
    dob: new Date(2003, 9, 19),
    courses: [new Course('math', 2.9), new Course('computers', 3.7)]
  }
];

export async function calculate_gpa(courses: Course[]) {
  await new Promise((v) => setTimeout(v, 100 + Math.random() * 50));
  return courses.reduce((sum, v) => sum + v.grade, 0) / courses.length;
}

export async function find_student(username: string) {
  await new Promise((v) => setTimeout(v, 200 + Math.random() * 50));
  const student = students.find((v) => v.username === username);
  if (!student) {
    throw new Error(`no student found for username: ${username}`);
  }
  return student;
}
