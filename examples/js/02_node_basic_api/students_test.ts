// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { touca } from '@touca/node';
import { calculate_gpa, parse_profile } from './students';

touca.workflow('students_test', (username: string) => {
  const student = parse_profile(username);
  touca.add_assertion('username', student.username);
  touca.add_result('student', student);
  touca.add_result('fullname', student.fullname);
  touca.add_result('birth_date', student.dob);
  touca.add_result('gpa', calculate_gpa(student.courses));
});

touca.run();
