// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { touca } from '../src';
import { find_student } from './sample';

touca.workflow('students_test', async (username: string) => {
  touca.start_timer('find_student');
  const student = await find_student(username);
  touca.stop_timer('find_student');
  touca.assume('username', student.username);
  touca.check('fullname', student.fullname);
  touca.check('birth_date', student.dob);
  touca.check('gpa', student.gpa);
  touca.add_metric('external_source', 1500);
});

touca.run();
