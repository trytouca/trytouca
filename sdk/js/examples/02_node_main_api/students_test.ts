// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { touca } from '@touca/node';
import { find_student } from './students';

touca.workflow('students_test', async (username: string) => {
  touca.start_timer('find_student');
  const student = await find_student(username);
  touca.stop_timer('find_student');
  touca.add_assertion('username', student.username);
  touca.add_result('fullname', student.fullname);
  touca.add_result('birth_date', student.dob);
  touca.add_result('gpa', student.gpa);
  touca.add_metric('external_source', 1500);
});

touca.run();
